import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Schema: Define qué campos tienen tus artículos
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transforma texto a fecha automáticamente
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// .optional() significa que NO es obligatoria
		heroImage: z.string().optional(),
	}),
});

export const collections = { blog };