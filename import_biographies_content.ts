import fs from 'fs/promises';
import path from 'path';

import {
    client,
    getReferenceByNameForMd
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Romans');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');

    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bAnnée\b|\bAuteur.ice.s\b|\bPays\b|\bGenre\b|\bExtraits et citations\b|\bTags\b|\bExtraits et citations\b|\bQuatrième de couverture\b|\bContexte et analyse\b|\bSources\b|\bPour aller plus loin\b|\bA propos des autrices\b|\bA propos de l’auteur.ice\b|\bA propos de l’autrice\b|\bA propos de l’auteur\b|\bA propos de l’aurice\b|\bA propos de l'auteur-ice\b/g, '\n').split(/\n/g)
    // trim strings
    const ref = _ref1.map((field) => {
        return field.trim()
    })

    const refTitle = ref[0].replace("# ", "")
    const refId = await getReferenceByNameForMd(refTitle)

    const finalRef = ref.map((e) => {
        return e.replace(/^[:]/g, ' ').trim()
    })

    const insertRef = {
        extractAndQuotes: finalRef[6],
        backCover: finalRef[7],
        contextAndAnalysis: (finalRef[8].includes(finalRef[2]) && finalRef[8].includes('A propos'))  ? null : finalRef[8],
        aboutAuthor: finalRef[9].includes('http') ? finalRef[8] : finalRef[9],
        sources: (!finalRef[10] || finalRef[10].includes('*')) ? null : finalRef[10],
        toGoFurther: [finalRef[11], finalRef[12]]
    }

    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (extract_and_quotes, back_cover, reference_id, context, about_author, sources, to_go_further) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [insertRef.extractAndQuotes, insertRef.backCover, refId, insertRef.contextAndAnalysis, insertRef.aboutAuthor, insertRef.sources, insertRef.toGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();