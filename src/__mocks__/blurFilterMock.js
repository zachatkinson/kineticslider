// Mock implementation of blurFilter.ts
export const createBlurFilter = jest.fn().mockReturnValue({
    type: 'blur',
    filter: { blur: 5 },
});