import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const client = new pg.Client({
  database: 'refemi',
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'XRNUj1989'
});
client.connect();

function labelise(catName: string) {
  return catName
    .toLocaleLowerCase()
    .replace(/ /g, '-')
    .replace(/'/g, '-')
    .replace(/[éèêë]/g, 'e')
    .replace(/[âà]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ï/g, 'i')
    .replace(/\./g, '');
}

async function getOrCreateCategorie(_catName: string) {
  const catName = _catName.trim().toLocaleLowerCase();

  let id = -1;
  client.query('begin');
  const res = await client.query(
    'select id from categories where category_name like $1',
    [catName]
  );
  if (res.rowCount === 0) {
    const insert = await client.query(
      'insert into categories (category_name, category_label) values ($1, $2)',
      [catName, labelise(catName)]
    );
    const res = await client.query(
      'select id from categories where category_name like $1',
      [catName]
    );
    id = res.rows[0].id;
  } else {
    id = res.rows[0].id;
  }
  client.query('commit');
  return id;
}

async function getOrCreateTheme(_themeName: string) {
  const themeName = _themeName.trim().toLocaleLowerCase();

  let id = -1;
  client.query('begin');
  const res = await client.query(
    'select id from themes where theme_name like $1',
    [themeName]
  );
  if (res.rowCount === 0) {
    const insert = await client.query(
      'insert into themes (theme_name, theme_label) values ($1, $2)',
      [themeName, labelise(themeName)]
    );
    const res = await client.query(
      'select id from themes where theme_name like $1',
      [themeName]
    );
    id = res.rows[0].id;
  } else {
    id = res.rows[0].id;
  }
  client.query('commit');
  return id;
}

function cleanLine(line: string) {
  let res = '';
  let inQuote = false;
  for (let car of line) {
    if (car === ',' && inQuote) {
      res += ';';
    } else if (car === '"') {
      inQuote = !inQuote;
      res += '"';
    } else {
      res += car;
    }
  }
  return res.replace(/"/g, '');
}

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data');

  const file = await fs.readFile(
    path.resolve(dataFolderPath, 'Arts vivants, théâtre et danse.csv'),
    'utf8'
  );

  const _refs = file.replace(/\r/g, '').split('\n');

  let refs: {
    nom: string;
    themes: number[];
    auteur: string;
    date: string;
    genre: number;
    pays: string;
  }[] = [];

  for (let line of _refs) {
    console.log(line);
    if (line.startsWith('Nom,Tags,Aute')) {
      continue;
    }
    const cleanedLine = cleanLine(line);
    const ref = cleanedLine.split(',');

    const themeNames = ref[1].split(';');
    let themes: number[] = [];
    for (let themeName of themeNames) {
      themes.push(await getOrCreateTheme(themeName));
    }

    refs.push({
      nom: ref[0],
      themes,
      auteur: ref[2],
      date: ref[3],
      genre: await getOrCreateCategorie(ref[4]),
      pays: ref[5]
    });
  }

  for (let ref of refs) {
    await client.query(
      `insert into "references" (
          reference_name,
          reference_country_name,
          reference_category_id,
          reference_theme_id,
          reference_author
        ) values ($1, $2, $3, $4, $5)`,
      [ref.nom, ref.pays, ref.genre, ref.themes, ref.auteur]
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
