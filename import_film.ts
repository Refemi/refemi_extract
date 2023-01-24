import fs from 'fs/promises';
import path from 'path';
import {
  cleanLine,
  getOrCreateTheme,
  client
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data');

  const file = await fs.readFile(
    path.resolve(dataFolderPath, 'Films et courts métrages.csv'),
    'utf8'
  );

  const _refs = file.replace(/\r/g, '').split('\n');

  let refs: {
    nom: string;
    themes: number[];
    auteur: string[];
    date: string[];
    pays: string[];
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

    const authorNames = ref[2].split(/[-,]+/);

    const dates = ref[3].split(/[-,]+/);

    const countries = ref[5].split(/[,]+/);

    refs.push({
      nom: ref[0],
      themes,
      auteur: authorNames,
      date: dates,
      pays: countries
    });
  }

  for (let ref of refs) {
    await client.query(
      `insert into "references" (
          reference_name,
          reference_country_name,
          reference_category_id,
          reference_theme_id,
          reference_date,
          reference_author
        ) values ($1, $2, $3, $4, $5, $6)`,
      [ref.nom, ref.pays, 11, ref.themes, ref.date, ref.auteur]
    );
    const res = await client.query(
      'select id from "references" where reference_name like $1',
      [ref.nom]
    );
    const refId = res.rows[0].id;

    for (let themeId of ref.themes) {
      await client.query(
        `insert into reference_themes (
            reference_theme_reference_id,
            reference_theme_id
          ) values ($1, $2)`,
        [refId, themeId]
      );
    }
  }
  console.log('Done.');
})();
