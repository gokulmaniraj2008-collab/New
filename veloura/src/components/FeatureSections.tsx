import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export interface StoryChapter {
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  id: string;
}

export const CHAPTERS: StoryChapter[] = [
  {
    number: '01', eyebrow: 'FORM / FUNCTION', title: 'A presence in motion.',
    body: 'Every surface catches the light with intention. Explore the low-slung silhouette from every angle, down to the signature front graphic.',
    label: 'THE EXTERIOR', id: 'exterior',
  },
  {
    number: '02', eyebrow: 'MATERIAL / LIGHT', title: 'Paint, with a point of view.',
    body: 'Three authored finishes take the same sculpted body somewhere new. Change colour instantly, then watch the studio light travel across the clearcoat.',
    label: 'THE FINISH', id: 'finish',
  },
  {
    number: '03', eyebrow: 'DRIVER / ENVIRONMENT', title: 'Made to be inhabited.',
    body: 'Move into the cockpit. A two-tone cabin, considered controls and individual trim materials reward a closer look.',
    label: 'THE COCKPIT', id: 'cockpit',
  },
  {
    number: '04', eyebrow: 'DETAIL / CRAFT', title: 'Nothing left to imagination.',
    body: 'From machined wheel faces to the shape of the rear, make one last circuit and discover the details that define the whole.',
    label: 'THE DETAILS', id: 'detail',
  },
  {
    number: '05', eyebrow: '360° / YOUR VIEW', title: 'The whole picture.',
    body: 'Return to the beginning. The final turn completes the full circle; the next one is yours to make.',
    label: 'THE GRAND TOUR', id: 'complete',
  },
];

interface FeatureSectionsProps { onChapterChange: (index: number) => void; }

export function FeatureSections({ onChapterChange }: FeatureSectionsProps) {
  return (
    <div className="story-flow" id="journey">
      {CHAPTERS.map((chapter, index) => (
        <section
          className={`story-section story-section-${index + 1}`}
          id={chapter.id}
          key={chapter.id}
          data-chapter={index}
          aria-labelledby={`${chapter.id}-title`}
          onPointerEnter={() => onChapterChange(index)}
        >
          <div className="story-copy">
            <div className="story-meta"><span>{chapter.number}</span><span className="story-rule" /><span>{chapter.eyebrow}</span></div>
            <span className="eyebrow">{chapter.label}</span>
            <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
            <p>{chapter.body}</p>
            <a className="text-link" href="#configurator"><span>Enter the studio</span><ArrowUpRight size={15} /></a>
          </div>
          <div className="story-side-note" aria-hidden="true">
            <span className="side-note-line" />
            <span>VELOURA / {chapter.number}</span>
          </div>
          {index === 0 && <a className="chapter-continue" href="#finish"><span>Scroll to explore</span><ArrowDownRight size={14} /></a>}
        </section>
      ))}
    </div>
  );
}
