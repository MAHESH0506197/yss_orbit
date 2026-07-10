// yss_orbit\frontend\src\core\validation\schemas\rbacSchemas.ts
import { z } from 'zod';

export const BaseSchema = z.object({ id: z.string().uuid() });
