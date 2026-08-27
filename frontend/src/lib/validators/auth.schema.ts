import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const admissionSchema = z.object({
  classId: z.string().min(1, 'Please select target grade/class'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  parentName: z.string().min(2, 'Guardian full name is required'),
  parentEmail: z.string().email('Valid guardian email is required'),
  parentPhone: z.string().min(6, 'Valid phone number is required'),
  address: z.string().min(5, 'Full residential address is required'),
  previousSchool: z.string().optional(),
});

export type AdmissionFormValues = z.infer<typeof admissionSchema>;
