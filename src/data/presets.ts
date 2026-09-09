import { TextPreset } from '../types';

export const PRESET_TEXTS: TextPreset[] = [
  // Korean - Word Practice
  {
    id: 'ko-words-easy',
    title: '한국어 기초 단어 (Basic Nouns)',
    language: 'ko',
    description: '가장 기본적인 한국어 명사와 일상 어휘 연습',
    content: '학교 학생 교실 컴퓨터 가방 학원 친구 사랑 바다 가을 하늘 나무 노래 음식 김치 사과 공원 시간 사람 나라 한국 가족 편지 아침 책상 의자'
  },
  {
    id: 'ko-words-food',
    title: '한국 음식 이름 (Korean Dishes)',
    language: 'ko',
    description: '맛있는 한국 전통 및 현대 음식 명칭 연상 연습',
    content: '비빔밥 김치찌개 삼겹살 불고기 김밥 떡볶이 호떡 냉면 갈비탕 삼계탕 잡채 파전 순두부찌개 만두 족발 보쌈 닭갈비 육회 핫도그 호떡 송편'
  },
   {
    id: 'ko-words-arirang',
    title: '아리랑 (Arirang)',
    language: 'ko',
    description: '노래로 배우는 문해력 교실 : 미디어수업 1 아리랑',
    content: '아리랑 아리랑 아라리 고개 넘어간다 나 버리다 가시다 님 십리 발병 가자 어서가자 백두산 덜미 해 저물다 청천 하늘 잔별 우리 가슴 희망 많다 풍년 온다네 와요 삼천리 강산'
  },
     {
    id: 'ko-words-body',
    title: '머리 어깨 무릎 발 (head shoulders knees feet)',
    language: 'ko',
    description: '노래로 배우는 문해력 교실 : 미디어수업 2 머리 어깨 무릎 발',
    content: '머리 어깨 무릎 발 귀 코 입 입술 손 손가락 팔 다리 팔꿈치 발 발가락 허리 엉덩이 '
  },
     {
    id: 'ko-words-bear',
    title: '곰 세마리 (Three bears)',
    language: 'ko',
    description: '노래로 배우는 문해력 교실 : 미디어수업 3 곰 세마리',
    content: '곰 한마리 두마리 세마리 네마리 다섯마리 여섯마리 일곱마리 여덟마리 아홉마리 열마리 집 아빠 엄마 애기 뚱뚱하다 날씬하다 너무 귀여워 으쓱으쓱 잘한다'
  },
       {
    id: 'ko-words-jaljaljal',
    title: '잘잘잘 (Jal jal jal)',
    language: 'ko',
    description: '노래로 배우는 문해력 교실 : 미디어수업 4 잘잘잘',
    content: '잘잘잘 하나 할머니 지팡이 짚다 둘 두부장수 두부 팔다 셋 새색시 거울 보다 넷 냇가 빨래 하다 다섯 다람쥐 도토리 줍다 여섯 여학생 공부 일곱 일꾼 나무 여덟 엿장수 호박엿 아홉 아버지 신문 보다 열 열무장수 열무 오다 왔다'
  },
  
  // Korean - Sentence Practice
  {
    id: 'ko-sentences-basic',
    title: '한국어 기본 일상 회화 (Daily Dialogues)',
    language: 'ko',
    description: '한국 생활에서 가장 자주 쓰이는 핵심 문장들',
    content: '안녕하세요. 만나서 정말 반갑습니다.\n요즘 한국어를 열심히 공부하고 있어요.\n오늘 날씨가 아주 맑고 화창하네요.\n이 근처에 맛있는 식당이 어디에 있나요?\n가장 좋아하는 한국 음식은 비빔밥입니다.\n도와주셔서 진심으로 감사드립니다.\n내일 친구들과 같이 서울타워에 놀러 가요.'
  },
  {
    id: 'ko-sentences-proverbs',
    title: '한국의 지혜로운 속담 (Korean Proverbs)',
    language: 'ko',
    description: '깊은 뜻을 담고 있는 유명한 한국 속담 학습',
    content: '가는 말이 고와야 오는 말이 곱다.\n티끌 모아 태산이라는 말이 있습니다.\n시작이 반이라는 말처럼 용기를 내세요.\n금강산도 식후경이니 밥부터 맛있게 먹읍시다.\n세 살 버릇이 여든까지 간다고 합니다.\n백지장도 맞들면 낫다는 가치를 배웁니다.'
  },

  // Korean - Long Text Practice
  {
    id: 'ko-long-patriot',
    title: '애국가 1절-4절 (Korean National Anthem)',
    language: 'ko',
    description: '대한민국의 국가인 애국가 전절을 정성스럽게 타자해 봅시다.',
    content: '동해 물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세.\n무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세.\n남산 위에 저 소나무 철갑을 두른 듯 바람 서리 불변함은 우리 기상일세.\n무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세.\n가을 하늘 공활한데 높고 구름 없이 밝은 달은 우리 가슴 일편단심일세.\n무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세.\n이 기상과 이 맘으로 충성을 다하여 괴로우나 즐거우나 나라 사랑하세.\n무궁화 삼천리 화려 강산 대한 사람 대한으로 길이 보전하세.'
  },
  {
    id: 'ko-long-poem',
    title: '윤동주 - 별 헤는 밤 (Yoon Dong-ju Poem)',
    language: 'ko',
    description: '한국인들이 가장 구절을 애호하는 서정적이고 아름다운 현대시',
    content: '계절이 지나가는 하늘에는 가을로 가득 차 있습니다.\n나는 아무 걱정도 없이 가을 속의 별들을 다 헤일 듯합니다.\n가슴속에 하나 둘 새겨지는 별을 이제 다 못 헤는 것은\n쉬이 아침이 오는 까닭이요 내일 밤이 남은 까닭이요\n아직 나의 청춘이 다하지 않은 까닭입니다.\n별 하나에 추억과 별 하나에 사랑과 별 하나에 쓸쓸함과\n별 하나에 동경과 별 하나에 시와 별 하나에 어머니 어머니'
  },
  {
    id: 'ko-long-five magic words',
    title: '다섯 글자 예쁜말 (five magic words)',
    language: 'ko',
    description: '노래로 배우는 문해력 교실 : 미디어수업 5 다섯 글자 예쁜 말',
    content: '한 손 만으로도 세어 볼 수 있는 아름다운 말 정겨운 말\n한 손 만으로도 세어 볼 수 있는 다섯 글자 예쁜 말\n사랑합니다 고맙습니다 감사합니다 안녕하세요 아름다워요\n노력할게요 마음의 약속 꼭 지켜볼래요\n한 손 만으로도 세어 볼 수 있는 다섯 글자 예쁜 말\n한 손 만으로도 세어 볼 수 있는 아름다운 말 정겨운 말\n한 손 만으로도 세어 볼 수 있는 다섯글자 예쁜 말\n사랑합니다 고맙습니다 감사합니다 안녕하세요 아름다워요\n노력할게요 마음의 약속 꼭 지켜볼래요\n한 손 만으로도 세어 볼 수 있는 다섯 글자 예쁜 말'
  },

  // English - Word Practice
  {
    id: 'en-words-basic',
    title: 'English Academic Vocabulary',
    language: 'en',
    description: 'Basic academic nouns and key vocabulary for general learners',
    content: 'classroom student notebook computer horizon language memory summer island energy action history library future journey galaxy system visual option design yellow planet forest silver'
  },

  // English - Sentence Practice
  {
    id: 'en-sentences-quotes',
    title: 'Inspirational English Quotes',
    language: 'en',
    description: 'Inspiring quotes from history to boost your typing and positivity',
    content: 'Believe you can and you are halfway there.\nLearning is a treasure that will follow its owner everywhere.\nSuccess is not final failure is not fatal.\nIn the middle of every difficulty lies a great opportunity.\nDo what you can with what you have where you are.\nKindness is a language which the deaf can hear and the blind can see.'
  },

  // English - Long Text Practice
  {
    id: 'en-long-journey',
    title: 'The Road Less Traveled (A Reflection)',
    language: 'en',
    description: 'An elegant prose about making unique choices in language and life studies',
    content: 'Two roads diverged in a yellow wood and sorry I could not travel both and be one traveler long I stood.\nAnd looked down one as far as I could to where it bent in the undergrowth.\nThen took the other as just as fair and having perhaps the better claim because it was grassy and wanted wear.\nI shall be telling this with a sigh somewhere ages and ages hence.\nTwo roads diverged in a wood and I took the one less traveled by and that has made all the difference.'
  }
];
