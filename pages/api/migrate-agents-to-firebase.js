import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';
import { auth as firebaseAuth } from '../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication - only admins can migrate users
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }

    console.log('Starting agent migration to Firebase...');

    // Get all agents from database
    const agents = await prisma.user.findMany({
      where: { role: 'agent' },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isActive: true
      }
    });

    console.log(`Found ${agents.length} agents to migrate`);

    const results = {
      total: agents.length,
      migrated: 0,
      skipped: 0,
      errors: []
    };

    const defaultPassword = '1234567890';

    for (const agent of agents) {
      try {
        console.log(`Processing agent: ${agent.email}`);

        // Check if user already exists in Firebase
        let firebaseUser = null;
        try {
          firebaseUser = await firebaseAuth.getUserByEmail(agent.email);
          console.log(`Agent ${agent.email} already exists in Firebase, skipping...`);
          results.skipped++;
          continue;
        } catch (firebaseError) {
          if (firebaseError.code !== 'auth/user-not-found') {
            console.error(`Firebase error for ${agent.email}:`, firebaseError);
            results.errors.push({
              email: agent.email,
              error: `Firebase check failed: ${firebaseError.message}`
            });
            continue;
          }
        }

        // Create Firebase user
        const displayName = agent.displayName || `${agent.firstName} ${agent.lastName}`.trim() || agent.email;
        const firebaseUserData = {
          email: agent.email,
          password: defaultPassword,
          displayName: displayName,
          emailVerified: true,
          disabled: !agent.isActive
        };

        // Only add phone number if it exists and is valid
        if (agent.phoneNumber && agent.phoneNumber.trim()) {
          const cleanPhone = agent.phoneNumber.replace(/\s+/g, '');
          if (cleanPhone.match(/^\+\d{10,15}$/)) {
            firebaseUserData.phoneNumber = cleanPhone;
          }
        }

        firebaseUser = await firebaseAuth.createUser(firebaseUserData);
        
        // Update database user with Firebase UID (if different)
        if (agent.id !== firebaseUser.uid) {
          console.log(`Updating database ID from ${agent.id} to ${firebaseUser.uid}`);
          
          // This is complex because we need to update the primary key
          // For now, we'll keep the existing ID and add a note
          console.log(`Note: Agent ${agent.email} has database ID ${agent.id} but Firebase UID ${firebaseUser.uid}`);
        }

        console.log(`Successfully migrated agent ${agent.email} to Firebase`);
        results.migrated++;

      } catch (error) {
        console.error(`Error migrating agent ${agent.email}:`, error);
        results.errors.push({
          email: agent.email,
          error: error.message
        });
      }
    }

    console.log('Migration completed:', results);

    return res.status(200).json({
      success: true,
      message: 'Agent migration completed',
      results,
      note: 'All migrated agents can now log in with password: ' + defaultPassword
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
