import { en } from 'zod/locales';
import * as z from 'zod/mini';

/**
 * zod/mini ships without messages ("Invalid input" everywhere). Loading the English locale once
 * gives readable messages to forms (FE-25) and to VALIDATION_FAILED details from the API.
 * Imported for its side effect by src/index.ts.
 */
z.config(en());
