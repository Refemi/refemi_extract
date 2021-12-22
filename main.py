import codecs
import glob
from scrapy.selector import Selector

f = open("extract.sql", "a", encoding='utf-8')
f.write('INSERT INTO "references" ')
f.write('("reference_name", "reference_country_name", "reference_date", "reference_author", "reference_content", "reference_contributor_id", "reference_moderator_id", "reference_category_id", "reference_status")\n')
f.write('VALUES\n')

sql_themes_values = ""

reference_id = 2497

for file in glob.glob('./files/livres-et-essais/*'):

    try:
        raw = codecs.open(file, "r", "utf-8")
        html = raw.read()
        selector = Selector(text=html)

        title = selector.xpath('//title/text()').get().replace("'", "''")
        if title == 'Untitled':
            continue

        date = selector.xpath('//tbody/tr[1]/td/text()').get()
        if date is not None:
            date = date[:4]
        else:
            date = '1791'

        author = selector.xpath('//tbody/tr[2]/td/span/text()').get()
        if author is not None:
            author = author.replace("'", "''")
        else:
            author = 'N/C'

        country = selector.xpath('//tbody/tr[4]/td/span/text()').get()
        if country is not None:
            country = country.replace("'", "''")
        else:
            country = 'N/C'

        themes = selector.xpath('//tbody/tr[5]/td').get()
        themes_extract = []
        reference_id += 1

        for themes_split in themes.split('<span class="'):
            theme_span_split = themes_split.split('>')[1].split('<')[0]

            if theme_span_split:
                sql_themes_values += "({}, (SELECT id FROM themes WHERE LOWER(\"theme_label\") = LOWER('{}'))),\n".format(reference_id, theme_span_split.replace("'", "''"))

        content = selector.xpath('//div[re:test(@class, "page-body")]').get()
        content = content.split('<div class="page-body">')[1].split('</div>')[0].replace("'", "''")
        f.write('(\'{0}\', \'{1}\', \'{2}\', \'{3}\', \'{4}\', 11, 11, 2, true),\n'.format(title, country, date, author, content))
    except PermissionError:
        continue

f.write('\n\nINSERT INTO "reference_themes" ("reference_theme_reference_id", "reference_theme_id") VALUES\n')
f.write(sql_themes_values)
f.close()
