import pg from 'pg';

export const client = new pg.Client({
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

export async function getOrCreateCategory(_catName: string) {
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

export async function getOrCreateTheme(_themeName: string) {
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

export function cleanLine(line: string) {
  let res = '';
  let inQuote = true;
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
