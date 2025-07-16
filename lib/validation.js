import { z } from 'zod';

// Farmer validation schema
export const farmerSchema = z.object({
  nin: z.string().length(11, 'NIN must be exactly 11 digits').regex(/^\d+$/, 'NIN must contain only digits'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  phone: z.string().length(11, 'Phone number must be exactly 11 digits').regex(/^\d+$/, 'Phone must contain only digits'),
  email: z.string().email('Invalid email address').optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  ward: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().length(10, 'Account number must be exactly 10 digits').regex(/^\d+$/, 'Account number must contain only digits').optional(),
  bvn: z.string().length(11, 'BVN must be exactly 11 digits').regex(/^\d+$/, 'BVN must contain only digits').optional(),
  farmSize: z.number().positive('Farm size must be positive').optional(),
  primaryCrop: z.string().optional(),
  secondaryCrop: z.string().optional(),
  farmingExperience: z.number().nonnegative('Farming experience cannot be negative').optional(),
  farmLatitude: z.number().optional(),
  farmLongitude: z.number().optional(),
  farmPolygon: z.any().optional(),
});

// Referee validation schema
export const refereeSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().length(11, 'Phone number must be exactly 11 digits').regex(/^\d+$/, 'Phone must contain only digits'),
  relationship: z.string().min(2, 'Relationship must be specified'),
});

// User validation schema
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().optional(),
  role: z.enum(['agent', 'admin']).default('agent'),
});

// Search validation schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['nin', 'name', 'phone', 'email']).optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

// Certificate validation schema
export const certificateSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  expiryDate: z.string().optional(),
});
