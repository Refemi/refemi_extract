import fs from 'fs/promises';
import path from 'path';

import {
    client,
    getReferenceByNameForBooks
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Livres et essais');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');

    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bAnnée\b|\bGenre\b|\bPays\b|\bThèmes\b|\bExtraits et citations\b|\bDiscipline\b|\bQuatrième de couverture\b|\bContexte\b|\bStructure\b|\bAnalyse\b|\bPour aller plus loin\b|\bAuteur.ice\b|\bAuteur.ice.s\b|\bA propos de l’autrice\b|\bA propos des auteurices\b|\bSources\b/g, '\n').split(/\n/g)
    // trim strings
    const ref = _ref1.map((ref) => {
        return ref.trim()
    })

    const refTitle = ref[0].replace("# ", "")
    const refId: number = await getReferenceByNameForBooks(refTitle)
    const formattedRef = ref.map((field) => {
        if(field != null)
            return field.replace(/\0/g, '');
        else
            return '';
    })

    let toGoFurther: string[] = [];
    let i = 13

    if (formattedRef.length >= 14) {
        do {
            toGoFurther.push(formattedRef[i])
            i++
        } while (i < 16)
    }

    const finalRef = formattedRef.map((e) => {
        return e.replace(/^[:]/g, '').trim()
    })

    const formattedToGoFurther = toGoFurther.filter((link) => (link !== undefined && link !== ''))

    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (extract_and_quotes, back_cover, reference_id, context, book_structure, analysis, about_author, sources, to_go_further) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [finalRef[6], finalRef[7], refId, finalRef[8], finalRef[9], finalRef[10], finalRef[11], finalRef[12], formattedToGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();