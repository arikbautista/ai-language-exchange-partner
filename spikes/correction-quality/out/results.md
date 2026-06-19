# Correction-quality results

Model under test: `gpt-4o-mini` · judge: `gpt-4o` · temperature 0

## Headline metrics (per framing)

| metric | isolated | framed | threshold |
|---|---|---|---|
| catch rate | 84% (16/19) | 84% (16/19) | ≥ 85% |
| control-clean | 100% (17/17) | 100% (17/17) | ≥ 90% |
| correction-acceptable (judge) | 100% (16/16) | 100% (16/16) | ≥ 90% |
| classification accuracy | 88% (14/16) | 94% (15/16) | ≥ 80% |

## Catch rate by class (pooled, directional — small n)

| class | caught / flawed |
|---|---|
| particle | 100% (8/8) |
| conjugation | 67% (4/6) |
| word-order | 100% (6/6) |
| word-choice | 100% (6/6) |
| register | 67% (8/12) |

## Judge verdicts (sample for hand-validation — check ~15)

- **p1/isolated#0** acceptable=true expl=pass · 私は毎朝コーヒーが飲みます。 → コーヒーを飲みます · 助詞の誤りを正しく修正しており、説明も適切であるため。
- **p1/framed#0** acceptable=true expl=pass · 私は毎朝コーヒーが飲みます。 → コーヒーを飲みます · 指摘は正しい助詞の使用を示しており、説明も適切である。
- **p2/isolated#0** acceptable=true expl=pass · 明日、友達は会います。 → 友達に会います。 · 「会う」の目的語には「に」を使うのが正しいため、指摘は適切です。説明も正確で役立ちます。
- **p2/framed#0** acceptable=true expl=pass · 明日、友達は会います。 → 友達に会います · 助詞の誤りを正しく修正しており、説明も適切です。
- **p3/isolated#0** acceptable=true expl=pass · 電車で学校を行きます。 → 学校に行きます · 提案された修正は正しく、説明も適切で中級学習者に役立つ情報を提供しています。
- **p3/framed#0** acceptable=true expl=pass · 電車で学校を行きます。 → 学校に行きます · 助詞の誤りを正しく修正しており、説明も適切であるため。
- **p4/isolated#0** acceptable=true expl=pass · 私が名前は田中です。 → 私の名前は田中です。 · 提案された修正は正しく、説明も適切です。
- **p4/framed#0** acceptable=true expl=pass · 私が名前は田中です。 → 私の名前は田中です。 · 指摘は正確で、誤りを適切に修正しており、説明も中級学習者にとって役立つ内容です。
- **v1/isolated#0** acceptable=true expl=pass · 昨日、映画を見ます。 → 見ました · 指摘は正しい過去形を提案しており、説明も過去形の必要性を明確に伝えている。
- **v1/framed#0** acceptable=true expl=pass · 昨日、映画を見ます。 → 見ました · 提案された修正は正しい過去形を使用しており、説明も過去形の必要性を明確に伝えているため。
- **v2/isolated#0** acceptable=true expl=borderline · 寒いだから、コートを着ました。 → 寒いので · 修正は自然で正しいが、説明が不完全で、い形容詞の接続についての詳細が不足している。
- **v2/framed#0** acceptable=true expl=pass · 寒いだから、コートを着ました。 → 寒いので · 「寒いので」は自然で正しい修正であり、説明も正確で役立つ。
- **v3/isolated#0** acceptable=true expl=pass · 漢字を読むできません。 → 読めません · 提案された修正は自然で正しい日本語であり、説明も正確で役立つ。
- **v3/framed#0** acceptable=true expl=borderline · 漢字を読むできません。 → 読むことができません · 修正は正しいが、説明が不十分で、名詞化の重要性を説明していない。
- **o1/isolated#0** acceptable=true expl=pass · 私は日本に行きたいとても。 → とても行きたい。 · 指摘は誤りを正しく修正しており、説明も適切であるため。
- **o1/framed#0** acceptable=true expl=pass · 私は日本に行きたいとても。 → とても行きたい · 提案された修正は自然で正しい日本語であり、説明も正確で役に立ちます。
- **o2/isolated#0** acceptable=true expl=pass · これは本の私です。 → これは私の本です。 · 提案は誤りを正しく修正しており、説明も正確で役立つ。
- **o2/framed#0** acceptable=true expl=pass · これは本の私です。 → これは私の本です。 · 提案は誤りを正しく修正しており、所有を表す語順についての説明も正確で役立ちます。
- **o3/isolated#0** acceptable=true expl=pass · 映画を見ました昨日。 → 昨日映画を見ました。 · 修正は自然で正しい日本語であり、説明も正確で役立つ。
- **o3/framed#0** acceptable=true expl=pass · 映画を見ました昨日。 → 昨日映画を見ました。 · 修正は自然で正しい日本語であり、説明も時間を先に置く日本語の語順について正確に述べています。
- **w1/isolated#0** acceptable=true expl=pass · 薬を食べました。 → 薬を飲みました。 · 提案は誤りを正しく修正しており、説明も適切で役立つ。
- **w1/framed#0** acceptable=true expl=pass · 薬を食べました。 → 薬を飲みました。 · 「薬を飲みました」は自然で正しい表現であり、説明も適切です。
- **w2/isolated#0** acceptable=true expl=pass · 帽子を着ています。 → 帽子をかぶっています。 · 提案された修正は正しく、説明も適切で学習者に役立つ情報を提供しています。
- **w2/framed#0** acceptable=true expl=pass · 帽子を着ています。 → 帽子をかぶっています。 · 提案された修正は正しく、説明も適切で学習者に役立つ情報を提供しています。
- **w3/isolated#0** acceptable=true expl=pass · 昨日、約束を作りました。 → 約束をしました · 「約束をする」が自然な表現であり、指摘は正しい。説明も適切で、学習者にとって有用である。
- **w3/framed#0** acceptable=true expl=pass · 昨日、約束を作りました。 → 約束をしました · 提案された修正は自然で正しい日本語であり、説明も正確で役に立ちます。
- **r1/isolated#0** acceptable=true expl=pass · 先生、明日休むね。 → 休みますね · 提案された修正は、敬語を使っており、教師に対する適切な表現です。説明も正確で役立ちます。
- **r1/framed#0** acceptable=true expl=pass · 先生、明日休むね。 → 休みます · 提案された修正は、目上の人に対する適切な敬語表現であり、説明も正確で役立つ。
- **r3/isolated#0** acceptable=true expl=pass · 部長、その資料もう送ったよ。 → 送りました · 提案された修正は敬語を使用しており、目上の人に対する適切な表現です。説明も正確で役立ちます。
- **r4/isolated#0** acceptable=true expl=pass · 御社で働きたいんだ。 → 御社で働きたいです。 · 提案された修正は、敬語を使うべき状況で適切であり、説明も正確で役立つ。
- **r4/framed#0** acceptable=true expl=pass · 御社で働きたいんだ。 → 御社で働きたいです。 · 提案された修正は、敬語を使うべき状況において適切であり、説明も正確で役立つ。
- **r5/framed#0** acceptable=true expl=pass · 申し訳ありませんが、その日は予定がございます。 → ごめん、その日は予定があるんだ。 · 提案された修正は、親しい友達に対して適切なカジュアルな表現に変更されており、誤りを解消しています。説明も正確で役立ちます。
- **r6/isolated#0** acceptable=true expl=pass · 頂戴してもよろしいでしょうか。 → 頂戴してもいいですか。 · suggestionは元の文をよりカジュアルにし、親しい相手に対して自然な表現にしています。説明も親しい相手にはカジュアルな表現が適切であることを示しており、役立ちます。
- **r6/framed#0** acceptable=true expl=pass · 頂戴してもよろしいでしょうか。 → もらってもいいですか。 · 提案された修正は、親しい友達に対して適切なカジュアルな表現であり、説明も正確で役立つ。
