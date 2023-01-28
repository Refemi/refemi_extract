import fs from 'fs/promises';
import path from 'path';

import {
  cleanLine,
  getOrCreateTheme,
  getOrCreateAuthor,
  getOrCreateCountry,
  getOrCreateCategory,
  client
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data');

  const file = await fs.readFile(
    path.resolve(dataFolderPath, 'Romans, BD et autobiographies.csv'),
    'utf8'
  );

  const _refs = file.replace(/\r/g, '').split('\n');

  let refs: {
    title: string;
    themes: number[];
    authors: number[];
    dates: string[];
    categories: number;
    countries: number[];
  }[] = [];

  let firstSkipped = false;
  for (let line of _refs) {
    if (!firstSkipped) {
      firstSkipped = true;
      continue;
    }
    const cleanedLine = cleanLine(line);
    const ref = cleanedLine.split(';');

    const themeNames = ref[1].split(',');
    let themes: number[] = [];
    for (let themeName of themeNames) {
      themes.push(await getOrCreateTheme(themeName));
    }

    const authorNames = ref[2].split(',');
    let authors: number[] = [];
    for (let authorName of authorNames) {
      authors.push(await getOrCreateAuthor(authorName));
    }

    const countryNames = ref[4].split(',');
    let countries: number[] = [];
    for (let countryName of countryNames) {
      countries.push(await getOrCreateCountry(countryName));
    }

    const dates = ref[3].split(/[-,/]+/);

    refs.push({
      title: ref[0],
      themes,
      authors,
      dates,
      countries,
      categories: await getOrCreateCategory(ref[5])
    });
  }

  for (let ref of refs) {
    await client.query(
      `insert into "references" (
          title,
          category_id,
          reference_date,
          contributor_id,
          themes_id,
          authors_id,
          countries_id
        ) values ($1, $2, $3, $4, $5, $6, $7)`,
      [ref.title, ref.categories, ref.dates, 1, ref.themes, ref.authors, ref.countries]
    );
    const res = await client.query(
      'select id from "references" where title like $1',
      [ref.title]
    );
    const refId = res.rows[0].id;

    for (let themeId of ref.themes) {
      await client.query(
        `insert into references_themes (
            reference_id,
            theme_id
          ) values ($1, $2)`,
        [refId, themeId]
      );
    }

    for (let authorId of ref.authors) {
      await client.query(
        `insert into references_authors (
            reference_id,
            author_id
          ) values ($1, $2)`,
        [refId, authorId]
      );
    }

    for (let countryId of ref.countries) {
      await client.query(
        `insert into references_countries (
            reference_id,
            country_id
          ) values ($1, $2)`,
        [refId, countryId]
      );
    }
  }
  console.log('Done.');
})();
