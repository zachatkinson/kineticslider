import { beforeEach, describe, expect, it, vi } from "vitest";

import { _slideSchema as slideSchema } from "@/schemas/slide.schema";
import { clearValidationCache, toSlideId } from "@/utils/validation";

describe("Schema Validation", () => {
  beforeEach(() => {
    clearValidationCache();
    vi.resetAllMocks();
  });

  describe("SlideSchema", () => {
    it("has the expected structure and validation rules", () => {
      // Check core properties exist
      expect(slideSchema).toHaveProperty("id");
      expect(slideSchema).toHaveProperty("title");
      expect(slideSchema).toHaveProperty("description");
      expect(slideSchema).toHaveProperty("image");
      expect(slideSchema).toHaveProperty("alt");
      expect(slideSchema).toHaveProperty("order");
      expect(slideSchema).toHaveProperty("metadata");

      // Check that properties have defined options
      if (
        slideSchema["id"] &&
        slideSchema["title"] &&
        slideSchema["description"] &&
        slideSchema["image"] &&
        slideSchema["alt"]
      ) {
        expect(slideSchema["id"].options).toBeDefined();
        expect(slideSchema["title"].options).toBeDefined();
        expect(slideSchema["description"].options).toBeDefined();
        expect(slideSchema["image"].options).toBeDefined();
        expect(slideSchema["alt"].options).toBeDefined();
      }
    });

    describe("id field validation", () => {
      it("has required option set to true", () => {
        const field = slideSchema["id"];
        if (field && field.options) {
          expect(field.options.required).toBe(true);
        }
      });

      it("has type defined as string", () => {
        const field = slideSchema["id"];
        if (field) {
          expect(field.type).toBe("string");
        }
      });
    });

    describe("title field validation", () => {
      it("has required option set to true", () => {
        const field = slideSchema["title"];
        if (field && field.options) {
          expect(field.options.required).toBe(true);
        }
      });

      it("has minLength constraint", () => {
        const field = slideSchema["title"];
        if (field && field.options) {
          expect(field.options.minLength).toBeGreaterThan(0);
        }
      });

      it("has maxLength constraint", () => {
        const field = slideSchema["title"];
        if (field && field.options) {
          expect(field.options.maxLength).toBeDefined();
        }
      });
    });

    describe("description field validation", () => {
      it("has required option defined", () => {
        const field = slideSchema["description"];
        if (field && field.options) {
          expect(field.options.required).toBeDefined();
        }
      });

      it("has maxLength constraint", () => {
        const field = slideSchema["description"];
        if (field && field.options) {
          expect(field.options.maxLength).toBeDefined();
        }
      });
    });

    describe("image field validation", () => {
      it("has required option set to true", () => {
        const field = slideSchema["image"];
        if (field && field.options) {
          expect(field.options.required).toBe(true);
        }
      });

      it("has pattern validation", () => {
        const field = slideSchema["image"];
        if (field && field.options) {
          expect(field.options.pattern).toBeInstanceOf(RegExp);
        }
      });

      it("has custom validation function", () => {
        const field = slideSchema["image"];
        if (field && field.options) {
          expect(field.options.custom).toBeInstanceOf(Function);
        }
      });
    });

    describe("alt field validation", () => {
      it("has required option set to true", () => {
        const field = slideSchema["alt"];
        if (field && field.options) {
          expect(field.options.required).toBe(true);
        }
      });

      it("has minLength constraint", () => {
        const field = slideSchema["alt"];
        if (field && field.options) {
          expect(field.options.minLength).toBeGreaterThan(0);
        }
      });

      it("has maxLength constraint", () => {
        const field = slideSchema["alt"];
        if (field && field.options) {
          expect(field.options.maxLength).toBeDefined();
        }
      });
    });

    describe("order field validation", () => {
      it("has number type", () => {
        const field = slideSchema["order"];
        if (field) {
          expect(field.type).toBe("number");
        }
      });
    });

    describe("metadata field validation", () => {
      it("has object type", () => {
        const field = slideSchema["metadata"];
        if (field) {
          expect(field.type).toBe("object");
        }
      });
    });
  });

  describe("toSlideId helper", () => {
    it("converts a string to a SlideId", () => {
      const id = toSlideId("test-id");
      expect(typeof id).toBe("string");
      expect(id).toBe("test-id");
    });

    it("works with empty strings", () => {
      const id = toSlideId("");
      expect(typeof id).toBe("string");
      expect(id).toBe("");
    });
  });
});
