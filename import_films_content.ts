import fs from 'fs/promises';
import path from 'path';

import {
    client,
    getReferenceByNameForMd
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Films');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');

    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bDate\b|\bGenre\b|\bPays\b|\bRéalisateur.ice.s\b|\bTags\b|\bSynopsis\b|\bContexte\b|\bAnalyse\b|\bA propos de la réalisatrice\b|\bPour aller plus loin\b|\bA propos des réalisateurices\b|\bA propos des réalisatrices\b|\bA propos de la réalisateurice\b|\bA propos du réalisateur\b/g, '\n').split(/\n/g)
    // trim strings
    const ref = _ref1.map((field) => {
        return field.trim()
    })

    const refTitle = ref[0].replace("# ", "")
    const refId = await getReferenceByNameForMd(refTitle)

    const finalRef = ref.map((e) => {
        return e.replace(/^[:]/g, ' ').trim()
    })

    let toGoFurther: string[] = [];
    let i = 10

    if (finalRef.length >= 9) {
        do {
            toGoFurther.push(finalRef[i])
            i++
        } while (i < 13)
    }
    const formattedToGoFurther = toGoFurther.filter((link) => (link !== undefined && link !== ''))
    
    const insertRef = {
        synopsis: finalRef[6],
        context: finalRef[7],
        analysis: finalRef[8],
        aboutAuthor: finalRef[9],
        toGoFurther: formattedToGoFurther
    }

    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (reference_id, synopsis, context, analysis, about_author, to_go_further) VALUES ($1, $2, $3, $4, $5, $6)`, [refId, insertRef.synopsis, insertRef.context, insertRef.analysis, insertRef.aboutAuthor, insertRef.toGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();