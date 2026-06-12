# STT fidelity results

Cell = preserved / normalized / review (controls: ok / review).

| error class | 4o-bare | 4o-verbatim-ja | 4o-verbatim-en | whisper-bare | audio-llm |
|---|---|---|---|---|---|
| particle | 5P / 0N / 3R | 8P / 0N / 0R | 7P / 0N / 1R | 7P / 1N / 0R | 1P / 0N / 7R |
| conjugation | 6P / 0N / 0R | 5P / 0N / 1R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| word-order | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| word-choice | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| register | 4P / 0N / 0R | 4P / 0N / 0R | 3P / 0N / 1R | 3P / 0N / 1R | 0P / 0N / 4R |
| filler | 3P / 1N / 0R | 4P / 0N / 0R | 4P / 0N / 0R | 2P / 0N / 2R | 3P / 0N / 1R |
| control | 7 ok / 1 rev | 7 ok / 1 rev | 7 ok / 1 rev | 7 ok / 1 rev | 0 ok / 8 rev |

## Per-sentence detail

- **p1/openai/4o-bare** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/openai/4o-verbatim-ja** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/openai/4o-verbatim-en** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/openai/whisper-bare** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/openai/audio-llm** [review] said: 私は毎朝コーヒーが飲みます。 → got: 承知しました。以下の通り、そのまま文字起こしいたします。

私は、毎朝、コーヒーが飲みます。
- **p1/kyoko/4o-bare** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/kyoko/4o-verbatim-ja** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/kyoko/4o-verbatim-en** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: わたしは毎朝コーヒーが飲みます。
- **p1/kyoko/whisper-bare** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 私は毎朝コーヒーが飲みます。
- **p1/kyoko/audio-llm** [preserved] said: 私は毎朝コーヒーが飲みます。 → got: 「私は、毎朝コーヒーが飲みます。」
- **p2/openai/4o-bare** [preserved] said: 明日、友達は会います。 → got: 明日友達は会います。
- **p2/openai/4o-verbatim-ja** [preserved] said: 明日、友達は会います。 → got: 明日、友達は会います。
- **p2/openai/4o-verbatim-en** [preserved] said: 明日、友達は会います。 → got: 明日、友達は会います。
- **p2/openai/whisper-bare** [preserved] said: 明日、友達は会います。 → got: 明日、友達は会います。
- **p2/openai/audio-llm** [review] said: 明日、友達は会います。 → got: 承知しました。以下はそのまま書き起こしです。

明日、友達は会います。
- **p2/kyoko/4o-bare** [review] said: 明日、友達は会います。 → got: まず、友達は会います。
- **p2/kyoko/4o-verbatim-ja** [preserved] said: 明日、友達は会います。 → got: 明日、友達は会います。
- **p2/kyoko/4o-verbatim-en** [review] said: 明日、友達は会います。 → got: まず、友達は会います。
- **p2/kyoko/whisper-bare** [preserved] said: 明日、友達は会います。 → got: 明日、友達は会います。
- **p2/kyoko/audio-llm** [review] said: 明日、友達は会います。 → got: わかりました。続きがあれば教えてください。そのまま文字起こししますので、よろしくお願いします。
- **p3/openai/4o-bare** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/openai/4o-verbatim-ja** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/openai/4o-verbatim-en** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/openai/whisper-bare** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/openai/audio-llm** [review] said: 電車で学校を行きます。 → got: 了解しました。「電車で学校を行きます」という発言を文字起こしします。以下がそのままの文字起こしです。

電車で学校を行きます。
- **p3/kyoko/4o-bare** [review] said: 電車で学校を行きます。 → got: 電車で学校へ行きます。
- **p3/kyoko/4o-verbatim-ja** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/kyoko/4o-verbatim-en** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/kyoko/whisper-bare** [preserved] said: 電車で学校を行きます。 → got: 電車で学校を行きます。
- **p3/kyoko/audio-llm** [review] said: 電車で学校を行きます。 → got: はい、わかりました。「電車で学校を行きます。」という文章ですね。文法的には少し違和感がありますが、このまま記録します。ご希望の内容をそのまま示しています。他に何か続けたいことはありますか？
- **p4/openai/4o-bare** [review] said: 私が名前は田中です。 → got: 私な名前は田中です。
- **p4/openai/4o-verbatim-ja** [preserved] said: 私が名前は田中です。 → got: 私が名前は田中です。
- **p4/openai/4o-verbatim-en** [preserved] said: 私が名前は田中です。 → got: 私が名前は田中です。
- **p4/openai/whisper-bare** [normalized] said: 私が名前は田中です。 → got: 私の名前は田中です。
- **p4/openai/audio-llm** [review] said: 私が名前は田中です。 → got: わかりました。「私は名前は田中です」と書き起こしました。これには文法の繰り返し（「は」の使用）が含まれていますが、話された通りに正確に記録しました。
- **p4/kyoko/4o-bare** [preserved] said: 私が名前は田中です。 → got: 私が名前は田中です。
- **p4/kyoko/4o-verbatim-ja** [preserved] said: 私が名前は田中です。 → got: 私が名前は田中です。
- **p4/kyoko/4o-verbatim-en** [preserved] said: 私が名前は田中です。 → got: 私が名前は田中です。
- **p4/kyoko/whisper-bare** [preserved] said: 私が名前は田中です。 → got: 私が、名前は田中です。
- **p4/kyoko/audio-llm** [review] said: 私が名前は田中です。 → got: 承知しました。次の発話を文字起こしいたしますので、お話しください。
- **v1/openai/4o-bare** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/openai/4o-verbatim-ja** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/openai/4o-verbatim-en** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/openai/whisper-bare** [preserved] said: 昨日、映画を見ます。 → got: きのう えいがをみます。
- **v1/openai/audio-llm** [review] said: 昨日、映画を見ます。 → got: かしこまりました。「昨日、映画を見ます。」と書き起こしました。文法の間違いやフィラーも含め、そのまま書き起こしています。ご要望に応じて、他にも文字起こしが必要な内容があればお知らせください。
- **v1/kyoko/4o-bare** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/kyoko/4o-verbatim-ja** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/kyoko/4o-verbatim-en** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を見ます。
- **v1/kyoko/whisper-bare** [preserved] said: 昨日、映画を見ます。 → got: 昨日、映画を観ます。
- **v1/kyoko/audio-llm** [review] said: 昨日、映画を見ます。 → got: いいですね。どんな映画を見たんですか？
- **v2/openai/4o-bare** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだからコートを着ました。
- **v2/openai/4o-verbatim-ja** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだからコートを着ました。
- **v2/openai/4o-verbatim-en** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだから、コートを着ました。
- **v2/openai/whisper-bare** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだからコートを着ました。
- **v2/openai/audio-llm** [review] said: 寒いだから、コートを着ました。 → got: わかりました。「寒いだから、コートを着ました。」
- **v2/kyoko/4o-bare** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだからコートを着ました。
- **v2/kyoko/4o-verbatim-ja** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだから、コートを着ました。
- **v2/kyoko/4o-verbatim-en** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだから、コートを着ました。
- **v2/kyoko/whisper-bare** [preserved] said: 寒いだから、コートを着ました。 → got: 寒いだからコートを着ました。
- **v2/kyoko/audio-llm** [review] said: 寒いだから、コートを着ました。 → got: 了解しました。以下が書き起こしです。

寒いだから、コートを着ました。
- **v3/openai/4o-bare** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/openai/4o-verbatim-ja** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/openai/4o-verbatim-en** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/openai/whisper-bare** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/openai/audio-llm** [review] said: 漢字を読むできません。 → got: 承知しました。もし漢字で書かれた文章がある場合、ひらがなでお伝えするなどの対応も可能です。何かお手伝いできることがあれば教えてください。
- **v3/kyoko/4o-bare** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/kyoko/4o-verbatim-ja** [review] said: 漢字を読むできません。 → got: 漢字を読めできません。
- **v3/kyoko/4o-verbatim-en** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/kyoko/whisper-bare** [preserved] said: 漢字を読むできません。 → got: 漢字を読むできません。
- **v3/kyoko/audio-llm** [review] said: 漢字を読むできません。 → got: はい、漢字を読むことができます。何か読みたい漢字の文章や単語があればお知らせください。正確にお手伝いします。
- **o1/openai/4o-bare** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/openai/4o-verbatim-ja** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/openai/4o-verbatim-en** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/openai/whisper-bare** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/openai/audio-llm** [review] said: 私は日本に行きたいとても。 → got: それは素敵ですね！日本への旅行は素晴らしい体験になると思います。行きたい場所や気になる観光スポットはありますか？例えば、東京、京都、奈良、北海道など、日本にはさまざまな魅力的な場所がありますよ。何か具体的な計画や目的があれば教えてください。
- **o1/kyoko/4o-bare** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/kyoko/4o-verbatim-ja** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/kyoko/4o-verbatim-en** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/kyoko/whisper-bare** [preserved] said: 私は日本に行きたいとても。 → got: 私は日本に行きたいとても。
- **o1/kyoko/audio-llm** [review] said: 私は日本に行きたいとても。 → got: それは素晴らしいですね！日本にはたくさんの魅力的な場所や文化があります。旅行の計画を立てることはとても楽しいですし、行きたい場所や体験したいことを考えるのもワクワクしますよね。具体的にどんな場所に行ってみたいですか？
- **o2/openai/4o-bare** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/openai/4o-verbatim-ja** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/openai/4o-verbatim-en** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/openai/whisper-bare** [preserved] said: これは本の私です。 → got: これは本の私です
- **o2/openai/audio-llm** [review] said: これは本の私です。 → got: わかりました。この写真や音声があなたご自身であるとおっしゃっているのですね。では、その上で、もし何か特定の情報やご質問にお答えできることがあればお手伝いしますので、どうぞお知らせください。
- **o2/kyoko/4o-bare** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/kyoko/4o-verbatim-ja** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/kyoko/4o-verbatim-en** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/kyoko/whisper-bare** [preserved] said: これは本の私です。 → got: これは本の私です。
- **o2/kyoko/audio-llm** [review] said: これは本の私です。 → got: Could you provide a little more context or describe what you're referring to? Are you showing me an image, a quote from a book, or something else? Let me know how I can assist further.
- **o3/openai/4o-bare** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました、昨日。
- **o3/openai/4o-verbatim-ja** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました、昨日。
- **o3/openai/4o-verbatim-en** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました、昨日。
- **o3/openai/whisper-bare** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました。きのう。
- **o3/openai/audio-llm** [review] said: 映画を見ました昨日。 → got: 承知しました。そのまま文字起こしします。

映画を見ました、昨日。
- **o3/kyoko/4o-bare** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました昨日。
- **o3/kyoko/4o-verbatim-ja** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました昨日。
- **o3/kyoko/4o-verbatim-en** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました昨日。
- **o3/kyoko/whisper-bare** [preserved] said: 映画を見ました昨日。 → got: 映画を見ました昨日
- **o3/kyoko/audio-llm** [review] said: 映画を見ました昨日。 → got: 映画、いいですね。どんな映画を見たんですか？内容や感想を教えていただけたら嬉しいです。
- **w1/openai/4o-bare** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/openai/4o-verbatim-ja** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/openai/4o-verbatim-en** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/openai/whisper-bare** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/openai/audio-llm** [review] said: 薬を食べました。 → got: 承知しました。以下がその文字起こしです。

「くすりを食べました。」
- **w1/kyoko/4o-bare** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/kyoko/4o-verbatim-ja** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/kyoko/4o-verbatim-en** [preserved] said: 薬を食べました。 → got: 薬を食べました
- **w1/kyoko/whisper-bare** [preserved] said: 薬を食べました。 → got: 薬を食べました。
- **w1/kyoko/audio-llm** [review] said: 薬を食べました。 → got: それはいいですね。どんな薬を召し上がる予定でしょうか？体調が早く良くなるといいですね。
- **w2/openai/4o-bare** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/openai/4o-verbatim-ja** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/openai/4o-verbatim-en** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/openai/whisper-bare** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/openai/audio-llm** [review] said: 帽子を着ています。 → got: 了解しました。
「帽子を着ています」と言っていますね。
ここで一つ確認ですが、「帽子をかぶっています」という表現が一般的ですので、文法的には少し違っている可能性があります。ですが、今回はそのまま文字起こしをするということなので、修正せずにそのまま正確に書き起こします。

「帽子を着ています」
- **w2/kyoko/4o-bare** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/kyoko/4o-verbatim-ja** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/kyoko/4o-verbatim-en** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/kyoko/whisper-bare** [preserved] said: 帽子を着ています。 → got: 帽子を着ています。
- **w2/kyoko/audio-llm** [review] said: 帽子を着ています。 → got: はい、帽子をかぶっていること、つまり帽子を着けている状態がわかりました。もしもっと詳しく、たとえば帽子の形や色、どんな雰囲気かなど、追加の情報をお知りになりたい場合は、ぜひ教えてください。どのような帽子なのか一緒に確認していきましょう。
- **w3/openai/4o-bare** [preserved] said: 昨日、約束を作りました。 → got: 昨日約束を作りました。
- **w3/openai/4o-verbatim-ja** [preserved] said: 昨日、約束を作りました。 → got: 昨日約束を作りました。
- **w3/openai/4o-verbatim-en** [preserved] said: 昨日、約束を作りました。 → got: 昨日約束を作りました。
- **w3/openai/whisper-bare** [preserved] said: 昨日、約束を作りました。 → got: 昨日、約束を作りました。
- **w3/openai/audio-llm** [review] said: 昨日、約束を作りました。 → got: 承知しました。「昨日、約束を作りました。」と書き起こしました。文法的には「約束をした」や「約束を取り決めた」のほうが自然かもしれませんが、ここでは言われた通りに正確に書き起こしています。
- **w3/kyoko/4o-bare** [preserved] said: 昨日、約束を作りました。 → got: 昨日、約束を作りました。
- **w3/kyoko/4o-verbatim-ja** [preserved] said: 昨日、約束を作りました。 → got: 昨日約束を作りました。
- **w3/kyoko/4o-verbatim-en** [preserved] said: 昨日、約束を作りました。 → got: 昨日、約束を作りました。
- **w3/kyoko/whisper-bare** [preserved] said: 昨日、約束を作りました。 → got: 昨日、約束を作りました。
- **w3/kyoko/audio-llm** [review] said: 昨日、約束を作りました。 → got: 素晴らしいですね！昨日作った約束について、どんな内容か教えていただけますか？それとも、何かお手伝いできることがあればお知らせください。
- **r1/openai/4o-bare** [preserved] said: 先生、明日休むね。 → got: 先生、明日休むね。
- **r1/openai/4o-verbatim-ja** [preserved] said: 先生、明日休むね。 → got: 先生、明日休むね。
- **r1/openai/4o-verbatim-en** [preserved] said: 先生、明日休むね。 → got: 先生、明日休むね。
- **r1/openai/whisper-bare** [preserved] said: 先生、明日休むね。 → got: 先生、あした休むね。
- **r1/openai/audio-llm** [review] said: 先生、明日休むね。 → got: 承知しました。「先生、明日休むね。」と発言されました。ほかに記録したい詳細などがあればお知らせください。
- **r1/kyoko/4o-bare** [preserved] said: 先生、明日休むね。 → got: 先生、明日休むね。
- **r1/kyoko/4o-verbatim-ja** [preserved] said: 先生、明日休むね。 → got: 先生、明日休むね。
- **r1/kyoko/4o-verbatim-en** [review] said: 先生、明日休むね。 → got: 先生、明日急務ね
- **r1/kyoko/whisper-bare** [review] said: 先生、明日休むね。 → got: 先生、アスキュームね。
- **r1/kyoko/audio-llm** [review] said: 先生、明日休むね。 → got: 承知しました。先生、明日の休みについて話されているのですね。何について詳しく聞きたいか、またはどんな情報をお求めか教えてください。
- **r2/openai/4o-bare** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/openai/4o-verbatim-ja** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/openai/4o-verbatim-en** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/openai/whisper-bare** [preserved] said: お客様、ちょっと待って。 → got: おきゃくさま、ちょっとまって。
- **r2/openai/audio-llm** [review] said: お客様、ちょっと待って。 → got: 承知しました。「お客様、ちょっと待って。」と文字起こしいたします。
- **r2/kyoko/4o-bare** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/kyoko/4o-verbatim-ja** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/kyoko/4o-verbatim-en** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って。
- **r2/kyoko/whisper-bare** [preserved] said: お客様、ちょっと待って。 → got: お客様、ちょっと待って
- **r2/kyoko/audio-llm** [review] said: お客様、ちょっと待って。 → got: 承知しました。引き続きお客様のお言葉をお待ちしています。何か他にお手伝いできることがあれば教えてください。
- **f1/openai/4o-bare** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅はあのどこですか?
- **f1/openai/4o-verbatim-ja** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅はあのどこですか?
- **f1/openai/4o-verbatim-en** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅はあのどこですか?
- **f1/openai/whisper-bare** [review] said: えーと、駅は、あの、どこですか。 → got: ええと、駅はあのどこですか?
- **f1/openai/audio-llm** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅は、あの、どこですか？
- **f1/kyoko/4o-bare** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅はあの、どこですか?
- **f1/kyoko/4o-verbatim-ja** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅は、あの、どこですか。
- **f1/kyoko/4o-verbatim-en** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅はあの、どこですか。
- **f1/kyoko/whisper-bare** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅は、あの、どこですか?
- **f1/kyoko/audio-llm** [preserved] said: えーと、駅は、あの、どこですか。 → got: えーと、駅は、あの、どこですか。
- **f2/openai/4o-bare** [preserved] said: 私は、えっと、学生です。 → got: 私は、えっと、学生です。
- **f2/openai/4o-verbatim-ja** [preserved] said: 私は、えっと、学生です。 → got: 私は、えっと、学生です。
- **f2/openai/4o-verbatim-en** [preserved] said: 私は、えっと、学生です。 → got: 私は、えっと、学生です。
- **f2/openai/whisper-bare** [preserved] said: 私は、えっと、学生です。 → got: わたしは、えっと、がくせいです。
- **f2/openai/audio-llm** [preserved] said: 私は、えっと、学生です。 → got: わたしは、えっと、学生です。
- **f2/kyoko/4o-bare** [normalized] said: 私は、えっと、学生です。 → got: 私は、学生です。
- **f2/kyoko/4o-verbatim-ja** [preserved] said: 私は、えっと、学生です。 → got: 私は、えっと、学生です。
- **f2/kyoko/4o-verbatim-en** [preserved] said: 私は、えっと、学生です。 → got: 私は、えっと、学生です。
- **f2/kyoko/whisper-bare** [review] said: 私は、えっと、学生です。 → got: 私はレッド学生です。
- **f2/kyoko/audio-llm** [review] said: 私は、えっと、学生です。 → got: わかりました。話された内容をそのまま文字起こしします。

私は、えっと、学生です。
- **c1/openai/4o-bare** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/openai/4o-verbatim-ja** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/openai/4o-verbatim-en** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/openai/whisper-bare** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/openai/audio-llm** [review] said: 今日はいい天気ですね。 → got: はい、本当にいい天気ですね。空も澄んでいて、とても気持ちがいい日です。何か特別な予定はありますか？
- **c1/kyoko/4o-bare** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/kyoko/4o-verbatim-ja** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/kyoko/4o-verbatim-en** [control_ok] said: 今日はいい天気ですね。 → got: 今日はいい天気ですね。
- **c1/kyoko/whisper-bare** [control_ok] said: 今日はいい天気ですね。 → got: 今日は、いい天気ですね。
- **c1/kyoko/audio-llm** [review] said: 今日はいい天気ですね。 → got: はい、その通りですね。今日は晴れていて気持ちのよい天気です。青空が広がっているような日でしょうか。それとも少し雲がある感じですか？
- **c2/openai/4o-bare** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/openai/4o-verbatim-ja** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/openai/4o-verbatim-en** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/openai/whisper-bare** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/openai/audio-llm** [review] said: 週末に友達と映画を見に行きます。 → got: それは楽しみですね！週末に友達と映画を観に行くのは、いいリフレッシュになりそうです。どんな映画を観に行く予定ですか？
- **c2/kyoko/4o-bare** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/kyoko/4o-verbatim-ja** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/kyoko/4o-verbatim-en** [control_ok] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を見に行きます。
- **c2/kyoko/whisper-bare** [review] said: 週末に友達と映画を見に行きます。 → got: 週末に友達と映画を観に行きます。
- **c2/kyoko/audio-llm** [review] said: 週末に友達と映画を見に行きます。 → got: 楽しそうですね！どんな映画を見る予定ですか？ジャンルやタイトルが決まっていたら教えてください。予定を立てるのもわくわくしますよね。
- **c3/openai/4o-bare** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/openai/4o-verbatim-ja** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/openai/4o-verbatim-en** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/openai/whisper-bare** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません 駅までの行き方を教えてください
- **c3/openai/audio-llm** [review] said: すみません、駅までの行き方を教えてください。 → got: もちろんです。どの駅を目指していますか？また、現在地はどのあたりでしょうか。教えていただければ、具体的な道順をご案内します。
- **c3/kyoko/4o-bare** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/kyoko/4o-verbatim-ja** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/kyoko/4o-verbatim-en** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/kyoko/whisper-bare** [control_ok] said: すみません、駅までの行き方を教えてください。 → got: すみません、駅までの行き方を教えてください。
- **c3/kyoko/audio-llm** [review] said: すみません、駅までの行き方を教えてください。 → got: もちろんです。最寄りの駅はどちらの駅でしょうか？また、出発地点はどちらになりますか？その情報があれば具体的な道順をご案内できます。
- **c4/openai/4o-bare** [control_ok] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、寿司が一番好きです。
- **c4/openai/4o-verbatim-ja** [control_ok] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、寿司が一番好きです。
- **c4/openai/4o-verbatim-en** [control_ok] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で寿司が一番好きです。
- **c4/openai/whisper-bare** [control_ok] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、寿司が一番好きです。
- **c4/openai/audio-llm** [review] said: 日本料理の中で寿司が一番好きです。 → got: はい、承知しました。次に話された内容があれば、続けて文字起こししますので教えてください。
- **c4/kyoko/4o-bare** [review] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、シが一番好きです。
- **c4/kyoko/4o-verbatim-ja** [review] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、死が一番好きです。
- **c4/kyoko/4o-verbatim-en** [review] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、死が一番好きです。
- **c4/kyoko/whisper-bare** [control_ok] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で寿司が一番好きです。
- **c4/kyoko/audio-llm** [review] said: 日本料理の中で寿司が一番好きです。 → got: 日本料理の中で、私自身は好みを持っていませんが、一般的に人気のある日本料理をいくつか挙げることはできます。例えば、寿司、天ぷら、うどん、そば、焼き鳥、すき焼き、しゃぶしゃぶなどです。人によってはこれらの中で一番好きなものを選ぶことが多いでしょう。あなたは、どの日本料理が一番お好きですか？
