import fs from 'fs/promises';
import path from 'path';

import {
    client,
    getReferenceByNameForMd
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Documentaires');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');

    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bDate\b|\bLiens\b|\bPays\b|\bRéalisateur.ice\b|\bTags\b|\bEpisodes\b|\bSynopsis\b|\bCitations\b|\bA propos du documentaire\b|\bA propos de la réalisatrice\b|\bPour aller plus loin\b|\bA propos des réalisateurices\b|\bA propos de la réalisateurice\b/g, '\n').split(/\n/g)
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
        links: finalRef[2].includes('http') ? finalRef[2] : null,
        episodes: finalRef[2].includes('http') ? finalRef[6] : finalRef[5],
        synopsis: finalRef[2].includes('http') ? finalRef[7] : finalRef[6],
        quotes: finalRef[2].includes('http') ? finalRef[8] : finalRef[7],
        aboutReference: finalRef[2].includes('http') ? finalRef[9] : finalRef[8],
        aboutAuthor: finalRef[2].includes('http') ? finalRef[10] : finalRef[9],
        toGoFurther: finalRef[2].includes('http') ? [finalRef[11], finalRef[12]] :[finalRef[10], finalRef[11]]
    }
    
    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (reference_id, links, episodes, synopsis, extract_and_quotes, about_reference, about_author, to_go_further) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [refId, insertRef.links, insertRef.episodes, insertRef.synopsis, insertRef.quotes, insertRef.aboutReference, insertRef.aboutAuthor, insertRef.toGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();