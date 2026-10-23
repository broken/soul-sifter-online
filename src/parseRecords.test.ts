import { describe, it, expect } from 'vitest';
import { parseRecords } from '../cli/src/commands/push';

describe('parseRecords', () => {
  it('parses standard single-line records', () => {
    const content = '1\tRock\t\\N\t\\N\tRock genre\n2\tPop\t\\N\t\\N\tPop genre\n';
    const records = parseRecords(content, 'Styles');
    expect(records.size).toBe(2);
    expect(records.get('1')?.key).toBe(1);
    expect(records.get('2')?.key).toBe(2);
  });

  it('parses multiline records with backslash continuations like the user example', () => {
    const content = `325\talt-pop\t\\N\t\\N\tKeeps the catchy melodies and accessibility of mainstream pop while incorporating unconventional songwriting, left-field production, and an indie or art-driven edge.\\
\\
• Sound  and Production: Merges electronic and acoustic elements, lo-fi textures, minimalist arrangements, and experimental or cinematic sound design rather than glossy, radio-formula polish.\\
• Emotional Tone: Often leans toward darker, moodier, or more downbeat atmospheres than bright traditional pop.\\
• Lyrical Themes: Focuses heavily on personal, introspective, and vulnerable topics like anxiety, alienation, identity, heartbreak, and adolescence.
326\tdark pop\t\\N\t\\N\tBlends catchy, radio-friendly song structures and hooks with somber, atmospheric, and melancholic sonic textures.\\

`;
    const records = parseRecords(content, 'Styles');
    expect(records.size).toBe(2);
    expect(records.has('325')).toBe(true);
    expect(records.get('325')?.key).toBe(325);
    expect(records.has('326')).toBe(true);
    expect(records.get('326')?.key).toBe(326);

    const record325 = records.get('325')?.line;
    expect(record325).toContain('Keeps the catchy melodies and accessibility of mainstream pop while incorporating unconventional songwriting, left-field production, and an indie or art-driven edge.\\n\\n• Sound  and Production:');
    expect(record325).toContain('• Sound  and Production: Merges electronic and acoustic elements, lo-fi textures, minimalist arrangements, and experimental or cinematic sound design rather than glossy, radio-formula polish.\\n• Emotional Tone:');
    expect(record325).toContain('• Emotional Tone: Often leans toward darker, moodier, or more downbeat atmospheres than bright traditional pop.\\n• Lyrical Themes:');

    const record326 = records.get('326')?.line;
    expect(record326).toBe('326\tdark pop\t\\N\t\\N\tBlends catchy, radio-friendly song structures and hooks with somber, atmospheric, and melancholic sonic textures.\\n');
  });

  it('handles CRLF line endings in multiline records', () => {
    const content = '10\tElectronic\t\\N\t\\N\tPart 1\\\r\nPart 2\\\r\nPart 3\r\n11\tHouse\t\\N\t\\N\tHouse desc\r\n';
    const records = parseRecords(content, 'Styles');
    expect(records.size).toBe(2);
    expect(records.get('10')?.key).toBe(10);
    expect(records.get('11')?.key).toBe(11);
    expect(records.get('10')?.line).toContain('Part 1\\nPart 2\\nPart 3');
  });

  it('parses association table records (e.g. SongStyles)', () => {
    const content = '100\t5\n100\t8\n101\t5\n';
    const records = parseRecords(content, 'SongStyles');
    expect(records.size).toBe(3);
    expect(records.get('100:5')?.key).toEqual([100, 5]);
    expect(records.get('100:8')?.key).toEqual([100, 8]);
    expect(records.get('101:5')?.key).toEqual([101, 5]);
  });

  it('distinguishes between escaped backslashes and line continuations', () => {
    // Record 1 ends with literal backslash (\\\\), not continuation
    // Record 2 is on next line
    const content = '1\tGenre1\t\\N\t\\N\tPath\\\\n\n2\tGenre2\t\\N\t\\N\tNormal\n';
    const records = parseRecords(content, 'Styles');
    expect(records.size).toBe(2);
    expect(records.get('1')?.key).toBe(1);
    expect(records.get('2')?.key).toBe(2);
  });
});
