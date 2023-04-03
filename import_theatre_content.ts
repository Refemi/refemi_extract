import fs from 'fs/promises';
import path from 'path';

import {
  cleanLine,
  getOrCreateTheme,
  getOrCreateAuthor,
  getOrCreateCountry,
  client
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Arts vivants, théâtre et danse');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');

    // replace \r and \n by spaces
    const _refs = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _refs1 = _refs.replace(/\bDate\b|\bGenre\b|\bPays\b|\bTags\b|\bSynopsis\b|\bA propos de la pièce\b|\bA propos de l’artiste\b|\bPour aller plus loin\b|\bAuteur.ice.s\b/g, '\n');
    // remove columns and split on line breaks
    const _refs2 = _refs1.replace(/[:]/g, '').split(/\n/g)
    // trim strings
    const refs = _refs2.map((ref) => {
        return ref.trim()
    })
    console.log(refs);
  }
  process.exit(1)
})();

//   const _refs = file.replace(/\r/g, '').split('\n');

//   let refs: {
//     title: string;
//     themes: number[];
//     authors: number[];
//     dates: string[];
//     countries: number[];
//   }[] = [];

//   let firstSkipped = false;
//   for (let line of _refs) {
//     if (!firstSkipped) {
//       firstSkipped = true;
//       continue;
//     }
//     const cleanedLine = cleanLine(line);
//     const ref = cleanedLine.split(';');

//     const themeNames = ref[1].split(',');
//     let themes: number[] = [];
//     for (let themeName of themeNames) {
//       themes.push(await getOrCreateTheme(themeName));
//     }

//     const authorNames = ref[2].split(',');
//     let authors: number[] = [];
//     for (let authorName of authorNames) {
//       authors.push(await getOrCreateAuthor(authorName));
//     }

//     const countryNames = ref[5].split(',');
//     let countries: number[] = [];
//     for (let countryName of countryNames) {
//       countries.push(await getOrCreateCountry(countryName));
//     }

//     const dates = ref[3].split(/[-,/]+/);

//     refs.push({
//       title: ref[0],
//       themes,
//       authors,
//       dates,
//       countries
//     });
//   }

//   for (let ref of refs) {
//     await client.query(
//       `insert into "references" (
//           title,
//           category_id,
//           reference_date,
//           contributor_id,
//           themes_id,
//           authors_id,
//           countries_id,
//           is_active,
//           is_validated
//         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
//       [ref.title, 361, ref.dates, 2, ref.themes, ref.authors, ref.countries, true, true]
//     );
//     const res = await client.query(
//       'select id from "references" where title like $1',
//       [ref.title]
//     );
//     const refId = res.rows[0].id;

//     for (let themeId of ref.themes) {
//       await client.query(
//         `insert into references_themes (
//             reference_id,
//             theme_id
//           ) values ($1, $2)`,
//         [refId, themeId]
//       );
//     }

//     for (let authorId of ref.authors) {
//       await client.query(
//         `insert into references_authors (
//             reference_id,
//             author_id
//           ) values ($1, $2)`,
//         [refId, authorId]
//       );
//     }

//     for (let countryId of ref.countries) {
//       await client.query(
//         `insert into references_countries (
//             reference_id,
//             country_id
//           ) values ($1, $2)`,
//         [refId, countryId]
//       );
//     }
//   }
//   console.log('Done.');
// })();
