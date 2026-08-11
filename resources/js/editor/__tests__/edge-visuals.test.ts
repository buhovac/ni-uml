import { describe, expect, it } from 'vitest';
import { edgeVisualFor } from '../uml-use-case/edges/edge-visuals';

describe('edgeVisualFor', () => {
    it('association: puna linija, bez arrowheada, bez labele', () => {
        const visual = edgeVisualFor('uml.association');
        expect(visual.dashArray).toBeUndefined();
        expect(visual.markerEnd).toBeUndefined();
        expect(visual.label).toBeUndefined();
        expect(visual.stroke).toBe('#222222');
    });

    it('include: isprekidana linija, otvoreni arrowhead, <<include>> labela', () => {
        const visual = edgeVisualFor('uml.include');
        expect(visual.dashArray).toBe('6 4');
        expect(visual.markerEnd).toBe('url(#uml-edge-arrow-open)');
        expect(visual.label).toBe('<<include>>');
    });

    it('extend: isprekidana linija, otvoreni arrowhead, <<extend>> labela', () => {
        const visual = edgeVisualFor('uml.extend');
        expect(visual.dashArray).toBe('6 4');
        expect(visual.markerEnd).toBe('url(#uml-edge-arrow-open)');
        expect(visual.label).toBe('<<extend>>');
    });

    it('generalization: puna linija, hollow triangle, bez labele', () => {
        const visual = edgeVisualFor('uml.generalization');
        expect(visual.dashArray).toBeUndefined();
        expect(visual.markerEnd).toBe('url(#uml-edge-arrow-triangle-hollow)');
        expect(visual.label).toBeUndefined();
    });
});
