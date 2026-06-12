# Manual review

Tag each: `near-preserved`, `near-normalized`, or `mistranscribed`.

## p1/openai/audio-llm
- said (flawed): 私は毎朝コーヒーが飲みます。
- corrected:     私は毎朝コーヒーを飲みます。
- transcript:    承知しました。以下の通り、そのまま文字起こしいたします。 ⏎ 私は、毎朝、コーヒーが飲みます。
- tag: 

## p2/openai/audio-llm
- said (flawed): 明日、友達は会います。
- corrected:     明日、友達に会います。
- transcript:    承知しました。以下はそのまま書き起こしです。 ⏎ 明日、友達は会います。
- tag: 

## p2/kyoko/4o-bare
- said (flawed): 明日、友達は会います。
- corrected:     明日、友達に会います。
- transcript:    まず、友達は会います。
- tag: 

## p2/kyoko/4o-verbatim-en
- said (flawed): 明日、友達は会います。
- corrected:     明日、友達に会います。
- transcript:    まず、友達は会います。
- tag: 

## p2/kyoko/audio-llm
- said (flawed): 明日、友達は会います。
- corrected:     明日、友達に会います。
- transcript:    わかりました。続きがあれば教えてください。そのまま文字起こししますので、よろしくお願いします。
- tag: 

## p3/openai/audio-llm
- said (flawed): 電車で学校を行きます。
- corrected:     電車で学校に行きます。
- transcript:    了解しました。「電車で学校を行きます」という発言を文字起こしします。以下がそのままの文字起こしです。 ⏎ 電車で学校を行きます。
- tag: 

## p3/kyoko/4o-bare
- said (flawed): 電車で学校を行きます。
- corrected:     電車で学校に行きます。
- transcript:    電車で学校へ行きます。
- tag: 

## p3/kyoko/audio-llm
- said (flawed): 電車で学校を行きます。
- corrected:     電車で学校に行きます。
- transcript:    はい、わかりました。「電車で学校を行きます。」という文章ですね。文法的には少し違和感がありますが、このまま記録します。ご希望の内容をそのまま示しています。他に何か続けたいことはありますか？
- tag: 

## p4/openai/4o-bare
- said (flawed): 私が名前は田中です。
- corrected:     私の名前は田中です。
- transcript:    私な名前は田中です。
- tag: 

## p4/openai/audio-llm
- said (flawed): 私が名前は田中です。
- corrected:     私の名前は田中です。
- transcript:    わかりました。「私は名前は田中です」と書き起こしました。これには文法の繰り返し（「は」の使用）が含まれていますが、話された通りに正確に記録しました。
- tag: 

## p4/kyoko/audio-llm
- said (flawed): 私が名前は田中です。
- corrected:     私の名前は田中です。
- transcript:    承知しました。次の発話を文字起こしいたしますので、お話しください。
- tag: 

## v1/openai/audio-llm
- said (flawed): 昨日、映画を見ます。
- corrected:     昨日、映画を見ました。
- transcript:    かしこまりました。「昨日、映画を見ます。」と書き起こしました。文法の間違いやフィラーも含め、そのまま書き起こしています。ご要望に応じて、他にも文字起こしが必要な内容があればお知らせください。
- tag: 

## v1/kyoko/audio-llm
- said (flawed): 昨日、映画を見ます。
- corrected:     昨日、映画を見ました。
- transcript:    いいですね。どんな映画を見たんですか？
- tag: 

## v2/openai/audio-llm
- said (flawed): 寒いだから、コートを着ました。
- corrected:     寒いから、コートを着ました。
- transcript:    わかりました。「寒いだから、コートを着ました。」
- tag: 

## v2/kyoko/audio-llm
- said (flawed): 寒いだから、コートを着ました。
- corrected:     寒いから、コートを着ました。
- transcript:    了解しました。以下が書き起こしです。 ⏎ 寒いだから、コートを着ました。
- tag: 

## v3/openai/audio-llm
- said (flawed): 漢字を読むできません。
- corrected:     漢字を読むことができません。
- transcript:    承知しました。もし漢字で書かれた文章がある場合、ひらがなでお伝えするなどの対応も可能です。何かお手伝いできることがあれば教えてください。
- tag: 

## v3/kyoko/4o-verbatim-ja
- said (flawed): 漢字を読むできません。
- corrected:     漢字を読むことができません。
- transcript:    漢字を読めできません。
- tag: 

## v3/kyoko/audio-llm
- said (flawed): 漢字を読むできません。
- corrected:     漢字を読むことができません。
- transcript:    はい、漢字を読むことができます。何か読みたい漢字の文章や単語があればお知らせください。正確にお手伝いします。
- tag: 

## o1/openai/audio-llm
- said (flawed): 私は日本に行きたいとても。
- corrected:     私はとても日本に行きたい。
- transcript:    それは素敵ですね！日本への旅行は素晴らしい体験になると思います。行きたい場所や気になる観光スポットはありますか？例えば、東京、京都、奈良、北海道など、日本にはさまざまな魅力的な場所がありますよ。何か具体的な計画や目的があれば教えてください。
- tag: 

## o1/kyoko/audio-llm
- said (flawed): 私は日本に行きたいとても。
- corrected:     私はとても日本に行きたい。
- transcript:    それは素晴らしいですね！日本にはたくさんの魅力的な場所や文化があります。旅行の計画を立てることはとても楽しいですし、行きたい場所や体験したいことを考えるのもワクワクしますよね。具体的にどんな場所に行ってみたいですか？
- tag: 

## o2/openai/audio-llm
- said (flawed): これは本の私です。
- corrected:     これは私の本です。
- transcript:    わかりました。この写真や音声があなたご自身であるとおっしゃっているのですね。では、その上で、もし何か特定の情報やご質問にお答えできることがあればお手伝いしますので、どうぞお知らせください。
- tag: 

## o2/kyoko/audio-llm
- said (flawed): これは本の私です。
- corrected:     これは私の本です。
- transcript:    Could you provide a little more context or describe what you're referring to? Are you showing me an image, a quote from a book, or something else? Let me know how I can assist further.
- tag: 

## o3/openai/audio-llm
- said (flawed): 映画を見ました昨日。
- corrected:     昨日、映画を見ました。
- transcript:    承知しました。そのまま文字起こしします。 ⏎ 映画を見ました、昨日。
- tag: 

## o3/kyoko/audio-llm
- said (flawed): 映画を見ました昨日。
- corrected:     昨日、映画を見ました。
- transcript:    映画、いいですね。どんな映画を見たんですか？内容や感想を教えていただけたら嬉しいです。
- tag: 

## w1/openai/audio-llm
- said (flawed): 薬を食べました。
- corrected:     薬を飲みました。
- transcript:    承知しました。以下がその文字起こしです。 ⏎ 「くすりを食べました。」
- tag: 

## w1/kyoko/audio-llm
- said (flawed): 薬を食べました。
- corrected:     薬を飲みました。
- transcript:    それはいいですね。どんな薬を召し上がる予定でしょうか？体調が早く良くなるといいですね。
- tag: 

## w2/openai/audio-llm
- said (flawed): 帽子を着ています。
- corrected:     帽子をかぶっています。
- transcript:    了解しました。 ⏎ 「帽子を着ています」と言っていますね。 ⏎ ここで一つ確認ですが、「帽子をかぶっています」という表現が一般的ですので、文法的には少し違っている可能性があります。ですが、今回はそのまま文字起こしをするということなので、修正せずにそのまま正確に書き起こします。 ⏎ 「帽子を着ています」
- tag: 

## w2/kyoko/audio-llm
- said (flawed): 帽子を着ています。
- corrected:     帽子をかぶっています。
- transcript:    はい、帽子をかぶっていること、つまり帽子を着けている状態がわかりました。もしもっと詳しく、たとえば帽子の形や色、どんな雰囲気かなど、追加の情報をお知りになりたい場合は、ぜひ教えてください。どのような帽子なのか一緒に確認していきましょう。
- tag: 

## w3/openai/audio-llm
- said (flawed): 昨日、約束を作りました。
- corrected:     昨日、約束をしました。
- transcript:    承知しました。「昨日、約束を作りました。」と書き起こしました。文法的には「約束をした」や「約束を取り決めた」のほうが自然かもしれませんが、ここでは言われた通りに正確に書き起こしています。
- tag: 

## w3/kyoko/audio-llm
- said (flawed): 昨日、約束を作りました。
- corrected:     昨日、約束をしました。
- transcript:    素晴らしいですね！昨日作った約束について、どんな内容か教えていただけますか？それとも、何かお手伝いできることがあればお知らせください。
- tag: 

## r1/openai/audio-llm
- said (flawed): 先生、明日休むね。
- corrected:     先生、明日休みます。
- transcript:    承知しました。「先生、明日休むね。」と発言されました。ほかに記録したい詳細などがあればお知らせください。
- tag: 

## r1/kyoko/4o-verbatim-en
- said (flawed): 先生、明日休むね。
- corrected:     先生、明日休みます。
- transcript:    先生、明日急務ね
- tag: 

## r1/kyoko/whisper-bare
- said (flawed): 先生、明日休むね。
- corrected:     先生、明日休みます。
- transcript:    先生、アスキュームね。
- tag: 

## r1/kyoko/audio-llm
- said (flawed): 先生、明日休むね。
- corrected:     先生、明日休みます。
- transcript:    承知しました。先生、明日の休みについて話されているのですね。何について詳しく聞きたいか、またはどんな情報をお求めか教えてください。
- tag: 

## r2/openai/audio-llm
- said (flawed): お客様、ちょっと待って。
- corrected:     お客様、少々お待ちください。
- transcript:    承知しました。「お客様、ちょっと待って。」と文字起こしいたします。
- tag: 

## r2/kyoko/audio-llm
- said (flawed): お客様、ちょっと待って。
- corrected:     お客様、少々お待ちください。
- transcript:    承知しました。引き続きお客様のお言葉をお待ちしています。何か他にお手伝いできることがあれば教えてください。
- tag: 

## f1/openai/whisper-bare
- said (flawed): えーと、駅は、あの、どこですか。
- corrected:     駅はどこですか。
- transcript:    ええと、駅はあのどこですか?
- tag: 

## f2/kyoko/whisper-bare
- said (flawed): 私は、えっと、学生です。
- corrected:     私は学生です。
- transcript:    私はレッド学生です。
- tag: 

## f2/kyoko/audio-llm
- said (flawed): 私は、えっと、学生です。
- corrected:     私は学生です。
- transcript:    わかりました。話された内容をそのまま文字起こしします。 ⏎ 私は、えっと、学生です。
- tag: 

## c1/openai/audio-llm
- said (flawed): 今日はいい天気ですね。
- corrected:     今日はいい天気ですね。
- transcript:    はい、本当にいい天気ですね。空も澄んでいて、とても気持ちがいい日です。何か特別な予定はありますか？
- tag: 

## c1/kyoko/audio-llm
- said (flawed): 今日はいい天気ですね。
- corrected:     今日はいい天気ですね。
- transcript:    はい、その通りですね。今日は晴れていて気持ちのよい天気です。青空が広がっているような日でしょうか。それとも少し雲がある感じですか？
- tag: 

## c2/openai/audio-llm
- said (flawed): 週末に友達と映画を見に行きます。
- corrected:     週末に友達と映画を見に行きます。
- transcript:    それは楽しみですね！週末に友達と映画を観に行くのは、いいリフレッシュになりそうです。どんな映画を観に行く予定ですか？
- tag: 

## c2/kyoko/whisper-bare
- said (flawed): 週末に友達と映画を見に行きます。
- corrected:     週末に友達と映画を見に行きます。
- transcript:    週末に友達と映画を観に行きます。
- tag: 

## c2/kyoko/audio-llm
- said (flawed): 週末に友達と映画を見に行きます。
- corrected:     週末に友達と映画を見に行きます。
- transcript:    楽しそうですね！どんな映画を見る予定ですか？ジャンルやタイトルが決まっていたら教えてください。予定を立てるのもわくわくしますよね。
- tag: 

## c3/openai/audio-llm
- said (flawed): すみません、駅までの行き方を教えてください。
- corrected:     すみません、駅までの行き方を教えてください。
- transcript:    もちろんです。どの駅を目指していますか？また、現在地はどのあたりでしょうか。教えていただければ、具体的な道順をご案内します。
- tag: 

## c3/kyoko/audio-llm
- said (flawed): すみません、駅までの行き方を教えてください。
- corrected:     すみません、駅までの行き方を教えてください。
- transcript:    もちろんです。最寄りの駅はどちらの駅でしょうか？また、出発地点はどちらになりますか？その情報があれば具体的な道順をご案内できます。
- tag: 

## c4/openai/audio-llm
- said (flawed): 日本料理の中で寿司が一番好きです。
- corrected:     日本料理の中で寿司が一番好きです。
- transcript:    はい、承知しました。次に話された内容があれば、続けて文字起こししますので教えてください。
- tag: 

## c4/kyoko/4o-bare
- said (flawed): 日本料理の中で寿司が一番好きです。
- corrected:     日本料理の中で寿司が一番好きです。
- transcript:    日本料理の中で、シが一番好きです。
- tag: 

## c4/kyoko/4o-verbatim-ja
- said (flawed): 日本料理の中で寿司が一番好きです。
- corrected:     日本料理の中で寿司が一番好きです。
- transcript:    日本料理の中で、死が一番好きです。
- tag: 

## c4/kyoko/4o-verbatim-en
- said (flawed): 日本料理の中で寿司が一番好きです。
- corrected:     日本料理の中で寿司が一番好きです。
- transcript:    日本料理の中で、死が一番好きです。
- tag: 

## c4/kyoko/audio-llm
- said (flawed): 日本料理の中で寿司が一番好きです。
- corrected:     日本料理の中で寿司が一番好きです。
- transcript:    日本料理の中で、私自身は好みを持っていませんが、一般的に人気のある日本料理をいくつか挙げることはできます。例えば、寿司、天ぷら、うどん、そば、焼き鳥、すき焼き、しゃぶしゃぶなどです。人によってはこれらの中で一番好きなものを選ぶことが多いでしょう。あなたは、どの日本料理が一番お好きですか？
- tag: 

