import { Browser, Page } from 'playwright';
import { launch } from '../../src/utils';
import { addInitScript } from '../../src/utils/context/register';
import { QAWolfWeb } from '../../src/web';
import { DEFAULT_ATTRIBUTE_LIST } from '../../src/web/attribute';
import { Cue } from '../../src/web/cues';
import { TEST_URL } from '../utils';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await launch();
  const context = await browser.newContext();
  await addInitScript(context);
  page = await context.newPage();
  await page.goto(`${TEST_URL}checkbox-inputs`);
});

afterAll(() => browser.close());

describe('buildCues', () => {
  const buildCues = async (selector: string): Promise<Cue[]> => {
    return page.evaluate(
      ({ attributes, selector }) => {
        const qawolf: QAWolfWeb = (window as any).qawolf;
        const target = document.querySelector(selector) as HTMLElement;

        return qawolf.buildCues({
          attributes,
          isClick: true,
          target,
        });
      },
      { attributes: DEFAULT_ATTRIBUTE_LIST.split(','), selector },
    );
  };

  it('builds cues for a target', async () => {
    const cues = await buildCues('#single');
    expect(cues).toMatchSnapshot();
  });
});

describe('buildCuesForElement', () => {
  const buildCuesForElement = async (selector: string): Promise<Cue[]> => {
    return page.evaluate(
      ({ selector }) => {
        const qawolf: QAWolfWeb = (window as any).qawolf;
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) return [];

        const cueTypesConfig = qawolf.getCueTypesConfig(['data-qa']);
        return qawolf.buildCuesForElement({
          cueTypesConfig,
          element,
          isClick: true,
          level: 1,
        });
      },
      {
        selector,
      },
    );
  };

  it('builds cues for an element', async () => {
    const cues = await buildCuesForElement('#single');
    expect(cues).toEqual([
      { level: 1, penalty: 5, type: 'id', value: '#single' },
      { level: 1, penalty: 40, type: 'tag', value: 'input' },
      {
        level: 1,
        penalty: 0,
        type: 'attribute',
        value: '[data-qa="html-checkbox"]',
      },
    ]);

    const cues2 = await buildCuesForElement('[for="single"]');
    expect(cues2).toEqual([
      { level: 1, penalty: 5, type: 'attribute', value: '[for="single"]' },
      { level: 1, penalty: 40, type: 'tag', value: 'label' },
      { level: 1, penalty: 12, type: 'text', value: '" Single checkbox"' },
    ]);

    const cues3 = await buildCuesForElement('#special\\:id');
    expect(cues3).toEqual([
      {
        level: 1,
        penalty: 10,
        type: 'class',
        value: '.special\\:class',
      },
      {
        level: 1,
        penalty: 5,
        type: 'id',
        value: '#special\\:id',
      },
      {
        level: 1,
        penalty: 40,
        type: 'tag',
        value: 'input:nth-of-type(2)',
      },
    ]);
  });
});

describe('buildCueValueForTag', () => {
  const buildCueValueForTag = async (selector: string): Promise<string> => {
    return page.evaluate((selector) => {
      const qawolf: QAWolfWeb = (window as any).qawolf;
      const element = document.querySelector(selector) as HTMLElement;

      return element
        ? qawolf.buildCueValueForTag(element)
        : 'ELEMENT NOT FOUND';
    }, selector);
  };

  it('returns tag name if no parent element', async () => {
    const value = await buildCueValueForTag('html');
    expect(value).toBe('html');
  });

  it('returns tag name if element has no siblings', async () => {
    const value = await buildCueValueForTag('.container h3');
    expect(value).toBe('h3');
  });

  it('returns tag name if element is first child', async () => {
    const value = await buildCueValueForTag('[for="single"]');
    expect(value).toBe('label');
  });

  it('returns nth-of-type tag if element is a lower sibling', async () => {
    const value = await buildCueValueForTag('[for="special\\:id"]');
    expect(value).toBe('label:nth-of-type(2)');
  });
});
