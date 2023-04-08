import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'querystring';

import {
    getReferenceByNameForMd,
    client,
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Séries');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');
    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bAnnée\b|\bGenre\b|\bPays\b|\bTags\b|\bSynopsis\b|\bDiscipline\b|\bQuatrième de couverture\b|\bContexte\b|\bStructure\b|\bAnalyse\b|\bPour aller plus loin\b|\bActeurs principaux\b|\bArtiste\b|\bA propos de la série\b|\bA propos du réalisateur\b|\bSources\b/g, '\n').split(/\n/g)
    // trim strings
    const ref = _ref1.map((ref) => {
        return ref.trim()
    })

    const refTitle = ref[0].replace("# ", "")
    const refId: number = await getReferenceByNameForMd(refTitle)
    const formattedRef = ref.map((field) => {
        return field.replace(/\0/g, '');
    })

    const finalRef = formattedRef.map((e) => {
        return e.replace(/^[:]/g, '').trim()
    })
    
    const insertRef = {
        mainActors: finalRef[5],
        synopsis: finalRef[6],
        aboutSerie: finalRef[7],
        aboutMovieMaker: finalRef[8],
        toGoFurther: finalRef[9]
    }

    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (actors, about_author, reference_id, about_reference, synopsis, to_go_further) VALUES ($1, $2, $3, $4, $5, $6)`, [insertRef.mainActors, insertRef.aboutMovieMaker, refId, insertRef.aboutSerie, insertRef.synopsis, insertRef.toGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();