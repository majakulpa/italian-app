#!/bin/bash
# Download research sources for the language-learning report into this directory.
# Each line: <output-filename>|<url>
cd "$(dirname "$0")" || exit 1
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

SOURCES='
karpicke-roediger-2008-retrieval.pdf|https://web.mit.edu/jbelcher/www/learner/retrieval.pdf
settles-meeder-2016-halflife-regression.pdf|https://research.duolingo.com/papers/settles.acl16.pdf
cepeda-2008-temporal-ridgeline.pdf|https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf
cepeda-2008-temporal-ridgeline-eric.pdf|https://files.eric.ed.gov/fulltext/ED505660.pdf
vesselinov-grego-2012-duolingo-report.pdf|https://comparelanguageapps.com/documentation/DuolingoReport_Final.pdf
vesselinov-grego-2012-duolingo-report-alt.pdf|https://theowlapp.health/wp-content/uploads/2022/04/DuolingoReport_Final-1.pdf
vesselinov-2016-babbel-study.pdf|https://comparelanguageapps.com/reports/Babbel2016study.pdf
isbell-2024-duolingo-llt.pdf|https://scholarspace.manoa.hawaii.edu/server/api/core/bitstreams/ea47a53e-da6e-4419-bd55-e72b458294f4/content
sung-2015-mall-meta-analysis-abstract.html|https://www.sciencedirect.com/science/article/abs/pii/S1747938X15000469
booton-2022-mall-benefits-risks.pdf|https://psychologicabelgica.com/articles/10.5334/pb.1146/galley/1301/download/
nation-2006-how-large-a-vocabulary.pdf|https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/2006-How-large-a-vocab.pdf
laufer-lexical-coverage-eric.pdf|https://files.eric.ed.gov/fulltext/EJ887873.pdf
input-interaction-output-eric.pdf|https://files.eric.ed.gov/fulltext/EJ1083691.pdf
krashen-critical-review-jehd.pdf|http://jehd.thebrpi.org/journals/jehd/Vol_4_No_4_December_2015/16.pdf
bjork-bjork-2011-desirable-difficulties.pdf|https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf
bjork-bjork-2019-blocking-myth.pdf|https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2020/01/BjorkBjorkEducatinMythChapterPublishedFormSept2019.pdf
retrieval-based-learning-decade-eric.pdf|https://files.eric.ed.gov/fulltext/ED599273.pdf
interleaved-spaced-repetition-callej.pdf|https://callej.org/index.php/journal/article/download/87/396/1359
pienemann-1989-is-language-teachable.pdf|https://www.library.brawnblog.com/pienemann1989-Is%20Language%20Teachable.pdf
papi-2010-l2-motivational-self-system.pdf|https://mostafapapi.com/wp-content/uploads/2021/09/papi-2010-system.pdf
gamified-apps-intentions-eric.pdf|https://files.eric.ed.gov/fulltext/EJ1482558.pdf
explicit-grammar-overstated-eric.pdf|https://files.eric.ed.gov/fulltext/EJ1397178.pdf
extensive-reading-listening-eric.pdf|https://files.eric.ed.gov/fulltext/ED573788.pdf
polish-learners-articles-ijern.pdf|https://www.ijern.com/journal/September-2013/12.pdf
cognate-effects-lexical-choice-arxiv.pdf|https://arxiv.org/pdf/1805.09590
optimizing-human-learning-arxiv.pdf|https://arxiv.org/pdf/1712.01856
metcalfe-bjork-region-proximal-learning.pdf|https://www.columbia.edu/cu/psychology/metcalfe/PDFs/Metcalfe-BjorkVolSubmitFeb14Final.pdf
'

echo "$SOURCES" | while IFS='|' read -r name url; do
  [ -z "$name" ] && continue
  if [ -s "$name" ]; then echo "SKIP $name"; continue; fi
  code=$(curl -sL -A "$UA" -o "$name" -w "%{http_code}" --max-time 90 "$url")
  size=$(stat -f%z "$name" 2>/dev/null || echo 0)
  echo "$code $size $name"
done
