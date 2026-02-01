'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/momentum-tracking.ts';
import '@/ai/flows/weekly-insight.ts';
import '@/ai/flows/weekly-summary.ts';
