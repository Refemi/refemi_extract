import fs from 'fs/promises';
import path from 'path';

import {
    getReferenceByName,
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
    const _ref = file.replace(/\r|\n|"/g, ' ')
    // replace certain words by line break
    const _ref1 = _ref.replace(/\bDate\b|\bGenre\b|\bPays\b|\bTags\b|\bSynopsis\b|\bA propos de la pièce\b|\bA propos de l’artiste\b|\bPour aller plus loin\b|\bAuteur.ice.s\b/g, '\n');
    // remove columns and split on line breaks
    const _ref2 = _ref1.replace(/[:]/g, '').split(/\n/g)
    // trim strings
    const ref = _ref2.map((ref) => {
        return ref.trim()
    })

    const refTitle = ref[0]
    const refId: number = await getReferenceByName(refTitle)

    let content: {
        about_author: string	
        about_reference: string
        reference_id: number
        to_go_further: string	
        synopsis: string	
        source: string
    }

    const formattedRef = ref.map((field) => {
        if(field != null)
            return field.replace(/\0/g, '');
        else
            return '';
    })

    client.query('begin');
    const res = await client.query(
        `INSERT INTO "contents" (about_author, about_reference, reference_id, to_go_further, synopsis) VALUES ($1, $2, $3, $4, $5)`, [formattedRef[8], formattedRef[7], refId, formattedRef[9], formattedRef[6]]
    )
    client.query('commit');

}
    console.log('Done')
    process.exit(1)
})();