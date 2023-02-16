import fs from 'fs/promises';
import path from 'path';
import {
  cleanLine,
  getOrCreateTheme,
  getOrCreateAuthor,
  getOrCreateField,
  client
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data');

  const file = await fs.readFile(
    path.resolve(dataFolderPath, 'Réseaux sociaux.csv'),
    'utf8'
  );

  const _refs = file.replace(/\r/g, '').split('\n');

  let refs: {
    title: string;
    themes: number[];
    platforms: number[];
    authors: number[];
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

    const authorNames = ref[4].split(',');
    let authors: number[] = [];
    for (let authorName of authorNames) {
      authors.push(await getOrCreateAuthor(authorName));
    }

    const platformNames = ref[2].split(',');
    let platforms: number[] = [];
    for (let platformName of platformNames) {
      platforms.push(await getOrCreateField(platformName));
    }

    refs.push({
      title: ref[0],
      themes,
      platforms,
      authors
    });
  }

  for (let ref of refs) {
    await client.query(
      `insert into "references" (
          title,
          category_id,
          themes_id,
          field,
          authors_id,
          contributor_id,
          is_active, 
          is_validated
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ref.title, 18, ref.themes, ref.platforms, ref.authors, 2, true, true]
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

    for (let fieldId of ref.platforms) {
      await client.query(
        `insert into references_fields (
            reference_id,
            field_id
          ) values ($1, $2)`,
        [refId, fieldId]
      );
    }
  }
  console.log('Done.');
})();
