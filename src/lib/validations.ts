import { z } from "zod";

export const createReviewSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  templateId: z.string().nullable().optional(),
  category: z.string().default("custom"),
  sections: z.array(
    z.object({
      sectionTitle: z.string(),
      content: z.string().default(""),
      order: z.number(),
    })
  ),
});

export const updateReviewSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        sectionTitle: z.string(),
        content: z.string(),
        order: z.number(),
      })
    )
    .optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "模板名称不能为空"),
  description: z.string().default(""),
  category: z.string().default("custom"),
  sections: z.array(
    z.object({
      title: z.string().min(1, "区块标题不能为空"),
      prompt: z.string().default(""),
      placeholder: z.string().default(""),
      type: z.enum(["text", "list"]).default("text"),
      required: z.boolean().default(false),
      order: z.number(),
    })
  ),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        prompt: z.string(),
        placeholder: z.string(),
        type: z.enum(["text", "list"]),
        required: z.boolean(),
        order: z.number(),
      })
    )
    .optional(),
});

export const createActionSchema = z.object({
  content: z.string().min(1, "行动项内容不能为空"),
  dueDate: z.string().datetime().optional(),
});

export const updateActionSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(["pending", "done", "deferred"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateReview = z.infer<typeof createReviewSchema>;
export type UpdateReview = z.infer<typeof updateReviewSchema>;
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type CreateAction = z.infer<typeof createActionSchema>;
export type UpdateAction = z.infer<typeof updateActionSchema>;
