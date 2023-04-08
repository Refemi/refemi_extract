import fs from 'fs/promises';
import path from 'path';

import {
    getReferenceByNameForMd,
    client,
} from './common';

(async () => {
  const dataFolderPath = path.resolve(__dirname, 'data', 'Réseaux sociaux');

  const dirs = await fs.readdir( path.resolve(dataFolderPath))
  for (const filePath of dirs) {
    const file = await fs.readFile(path.resolve(dataFolderPath, filePath), 'utf8');
    // replace \r and \n by spaces
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bAnnée\b|\bLiens\b|\bPlateforme\b|\bTags\b|\bA propos\b|\bPour aller plus loin\b|\bCréateur.ice\b/g, '\n').split(/\n/g)
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
        links: finalRef[2].includes('http') ? finalRef[2] : null,
        aboutReference: finalRef[5],
        toGoFurther: finalRef[6]
    }
    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (links, reference_id, about_reference, to_go_further) VALUES ($1, $2, $3, $4)`, [insertRef.links, refId, insertRef.aboutReference, insertRef.toGoFurther]
    )
    client.query('commit');
}
    console.log('Done')
    process.exit(1)
})();