# Correction-quality results

Model under test: `gpt-4o-mini` · judge: `gpt-4o` · temperature 0

## Headline metrics (per framing)

| metric | isolated | framed | threshold |
|---|---|---|---|
| catch rate | 80% (12/15) | 80% (12/15) | ≥ 85% |
| control-clean | 100% (15/15) | 100% (15/15) | ≥ 90% |
| correction-acceptable (judge) | 100% (12/12) | 100% (12/12) | ≥ 90% |
| classification accuracy | 92% (11/12) | 92% (11/12) | ≥ 80% |

## Catch rate by class (pooled, directional — small n)

| class | caught / flawed |
|---|---|
| particle | 100% (8/8) |
| conjugation | 67% (4/6) |
| word-order | 100% (6/6) |
| word-choice | 100% (6/6) |
| register | 0% (0/4) |

## Judge verdicts (sample for hand-validation — check ~15)

- **p1/isolated#0** acceptable=true expl=pass · 私は毎朝コーヒーが飲みます。 → コーヒーを飲みます · 提案された修正は正しく、説明も適切であるため。
- **p1/framed#0** acceptable=true expl=pass · 私は毎朝コーヒーが飲みます。 → コーヒーを飲みます · 提案された修正は正しく、説明も適切であるため。
- **p2/isolated#0** acceptable=true expl=pass · 明日、友達は会います。 → 友達に会います · 提案は正しい修正であり、説明も適切で役立つ。
- **p2/framed#0** acceptable=true expl=pass · 明日、友達は会います。 → 友達に会います · 提案された修正は正しく、説明も「会う」の目的語に「に」を使う理由を明確に示しています。
- **p3/isolated#0** acceptable=true expl=pass · 電車で学校を行きます。 → 学校に行きます · 「行く」には目的地を示す助詞「に」を使うのが正しいため、suggestionは適切です。説明も正確で役立ちます。
- **p3/framed#0** acceptable=true expl=pass · 電車で学校を行きます。 → 学校に行きます · 提案された修正は正しく、説明も適切であるため。
- **p4/isolated#0** acceptable=true expl=pass · 私が名前は田中です。 → 私の名前は田中です。 · 指摘は正確で、誤りを解消する自然な修正を提供しています。説明も適切です。
- **p4/framed#0** acceptable=true expl=pass · 私が名前は田中です。 → 私の名前は田中です。 · 指摘は正しい修正を提案しており、説明も適切です。
- **v1/isolated#0** acceptable=true expl=pass · 昨日、映画を見ます。 → 映画を見ました · 提案は正しい過去形を使用しており、説明も過去形の必要性を明確に伝えている。
- **v1/framed#0** acceptable=true expl=pass · 昨日、映画を見ます。 → 映画を見ました · 過去形にする必要があるという説明は正確で、学習者にとって役立つ情報です。
- **v2/isolated#0** acceptable=true expl=pass · 寒いだから、コートを着ました。 → 寒いので · 「寒いだから」は不自然で、「寒いので」は自然な表現です。説明も正確です。
- **v2/framed#0** acceptable=true expl=pass · 寒いだから、コートを着ました。 → 寒いので · 「寒いので」は自然で正しい修正であり、説明も正確で役立つ。
- **v3/isolated#0** acceptable=true expl=pass · 漢字を読むできません。 → 読むことができません · 提案された修正は正しく、説明も適切で役立つものです。
- **v3/framed#0** acceptable=true expl=pass · 漢字を読むできません。 → 読むことができません · 提案された修正は正しく、説明も適切で役に立ちます。
- **o1/isolated#0** acceptable=true expl=pass · 私は日本に行きたいとても。 → とても行きたい · 提案された修正は自然で正しい日本語であり、誤りを解消しています。説明も正確で中級学習者に役立ちます。
- **o1/framed#0** acceptable=true expl=pass · 私は日本に行きたいとても。 → とても行きたい · 提案された修正は自然で正しい日本語であり、説明も正確で役立つ。
- **o2/isolated#0** acceptable=true expl=pass · これは本の私です。 → これは私の本です。 · 提案は誤りを正しく修正しており、所有を表す語順についての説明も正確で役立ちます。
- **o2/framed#0** acceptable=true expl=pass · これは本の私です。 → これは私の本です。 · 提案は誤りを正しく修正しており、所有を表す語順についての説明も正確で役立ちます。
- **o3/isolated#0** acceptable=true expl=pass · 映画を見ました昨日。 → 昨日映画を見ました。 · 提案された修正は文法的に正しく、自然な日本語です。説明も時間を表す言葉の位置について正確で役立ちます。
- **o3/framed#0** acceptable=true expl=pass · 映画を見ました昨日。 → 昨日映画を見ました。 · 提案された修正は自然で正しい日本語であり、誤りを解消しています。説明も正確で役に立ちます。
- **w1/isolated#0** acceptable=true expl=pass · 薬を食べました。 → 薬を飲みました。 · 提案された修正は正しく、薬に対しては「飲む」を使うのが自然です。説明も正確で役立ちます。
- **w1/framed#0** acceptable=true expl=pass · 薬を食べました。 → 薬を飲みました。 · 提案された修正は正しく、説明も薬に対して「飲む」を使う理由を明確にしています。
- **w2/isolated#0** acceptable=true expl=pass · 帽子を着ています。 → 帽子をかぶっています。 · 「かぶる」は帽子に対して正しい動詞であり、説明も適切です。
- **w2/framed#0** acceptable=true expl=pass · 帽子を着ています。 → 帽子をかぶっています。 · 指摘は正確で、帽子に対する適切な動詞の選択を説明している。
- **w3/isolated#0** acceptable=true expl=pass · 昨日、約束を作りました。 → 約束をしました · 提案された修正は自然で正しい日本語であり、誤りを解消しています。説明も正確で役に立ちます。
- **w3/framed#0** acceptable=true expl=pass · 昨日、約束を作りました。 → 約束をしました · 「約束をする」が自然な表現であり、説明も正確で役立つため。
