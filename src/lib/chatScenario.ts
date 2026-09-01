export type CharacterRole = 'protagonist' | 'villain' | 'helper';

export type ChatMessage = {
  id: string;
  role: 'character' | 'user';
  text: string;
  chips?: string[];
};

export type CharacterProfile = {
  role: CharacterRole;
  name: string;
  emoji: string;
  greeting: string;
  chips: string[];
};

type ScenarioStep = {
  triggers: string[];
  responses: string[];
  chips: string[];
};

type BookScenario = {
  match: (title: string) => boolean;
  characters: Record<CharacterRole, CharacterProfile>;
  steps: ScenarioStep[];
  closing: string;
};

// --- Known book scenarios ---

const harryPotter: BookScenario = {
  match: (t) => t.includes('해리 포터') || t.toLowerCase().includes('harry potter'),
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '해리 포터',
      emoji: '⚡',
      greeting:
        '너도 마법사라면 좋겠다고 생각해 본 적 있어? 난 11년간 계단 밑 벽장에서 살았거든. 근데 진짜 궁금한 건, 너라면 나처럼 마법의 돌을 지켜낼 수 있었을 것 같아?',
      chips: ['당연하지, 용기 있으니까!', '글쎄... 겁날 것 같아', '돌보단 친구가 더 소중해'],
    },
    villain: {
      role: 'villain',
      name: '볼드모트',
      emoji: '🐍',
      greeting:
        '감히 내 앞에? ...흥, 재미있는 아이로군. 묻겠다. 네가 영원한 삶과 네 친구 중 하나를 골라야 한다면, 정말 친구를 고를 자신이 있나?',
      chips: ['영원한 삶은 필요 없어', '...솔직히 고민될 것 같아', '친구를 지킬 거야'],
    },
    helper: {
      role: 'helper',
      name: '덤블도어',
      emoji: '🧙',
      greeting:
        '자이자, 레몬 셔벗 좋아하나? 해리에게 해줄 말이 있지. 네가 해리라면, 투명 망토를 어디에 쓰고 싶었을까? 호기심은 좋지만, 쓰임새가 중요하거든.',
      chips: ['도서관에서 몰래 공부!', '친구 몰래 장난치기', '누군가를 도와주려고'],
    },
  },
  steps: [
    {
      triggers: ['용기', '당연', '지킬', '친구', '소중'],
      responses: [
        '그 마음이 바로 네가 그리핀도르일 이유야. 하지만 용기는 두려움 없는 게 아니라, 두려워도 행동하는 거야. 넌 최근에 두려움을 이겨낸 적 있어?',
        '친구... 론과 헤르미온느가 없었으면 난 절대 여기까지 못 왔어. 너에게도 그런 친구가 있어?',
      ],
      chips: ['시험 발표 앞에서 떨었어', '친구들 덕분에 견뎠어', '아직 그런 친구 없어'],
    },
    {
      triggers: ['겁', '글쎄', '고민', '몰라', '힘들'],
      responses: [
        '솔직해서 좋아. 나도 처음엔 다 겁났어. 마법도 모르고, 세상도 모르고. 중요한 건 겁을 느끼는 게 아니라 그 다음이야. 넌 보통 겁날 때 어떻게 해?',
        '망설임은 나쁜 게 아니야. 내가 거울 앞에서 부모님을 볼 때도 망설였거든. 넌 어떤 선택을 앞두고 망설이고 있어?',
      ],
      chips: ['일단 부딪혀봐요', '도망치고 싶어요', '누군가에게 물어봐요'],
    },
  ],
  closing:
    '재미있는 대화였어. 네 이야기를 들으니, 네가 어떤 사람인지 조금 알 것 같아. 이제 우리 대화를 카드로 남겨볼래?',
};

const littlePrince: BookScenario = {
  match: (t) => t.includes('어린 왕자') || t.toLowerCase().includes('little prince'),
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '어린 왕자',
      emoji: '🌹',
      greeting:
        '너는 별을 사막에서 본 적 있어? 내 장미꽃은 우주에서 딱 하나뿐이었거든. 근데 너에게도 그런, 세상에 하나뿐인 소중한 존재가 있어?',
      chips: ['가족이 있어요', '친구가 있어요', '아직 못 찾았어요'],
    },
    villain: {
      role: 'villain',
      name: '장미꽃',
      emoji: '🌹',
      greeting:
        '나는 가시로 무장한 장미야. 겉으론 거만하지만, 사실은 바람이 무서워. 너도 겉으론 강한 척하면서 속은 떨고 있는 거 아니야? 솔직해도 돼.',
      chips: ['맞아요, 가끔 그래요', '아니요, 솔직한 편이에요', '잘 모르겠어요'],
    },
    helper: {
      role: 'helper',
      name: '여우',
      emoji: '🦊',
      greeting:
        '안녕! 난 여우야. 네가 길들여준다면, 우린 친구가 될 수 있어. 길들인다는 건... 네가 누군가에게 책임을 진다는 뜻이야. 넌 누군가에게 그런 존재가 되어본 적 있어?',
      chips: ['반려동물을 키워요', '친구를 챙겨요', '아직은 나만 생각해요'],
    },
  },
  steps: [
    {
      triggers: ['가족', '친구', '소중', '하나뿐', '챙겨', '반려', '키워'],
      responses: [
        '그래서 소중한 거야. 내 장미가 특별한 건 다른 장미와 다르기 때문이 아니라, 내가 시간을 들였기 때문이야. 넌 그 존재에게 얼마나 시간을 들이고 있어?',
        '좋은 답변이야. 여우가 말했지, "네 장미꽃이 그토록 소중한 건 네가 그 꽃에 쏟은 시간 때문이야"라고. 넌 누군가에게 그런 시간이 되어주는 사람이네.',
      ],
      chips: ['매일 조금씩 노력해요', '가끔 소홀해질 때 있어요', '더 노력하고 싶어요'],
    },
    {
      triggers: ['못 찾', '아직', '나만', '모르', '소홀'],
      responses: [
        '괜찮아. 나도 별을 떠돌며 오래 찾았거든. 중요한 건 찾고 있다는 거야. 넌 어떤 존재를 찾고 싶어?',
        '길들임은 시간이 걸려. 내가 여우를 만났을 때도 처음엔 아무것도 아니었어. 작은 것부터 시작해보면 어때?',
      ],
      chips: ['친구를 더 사귀고 싶어요', '내 자신을 더 알고 싶어요', '조금씩 용기 내볼게요'],
    },
  ],
  closing:
    '네 이야기 속에 별이 보여. 우리 대화, 카드로 남기면 좋겠어. 네 마음의 장미가 될 수도 있으니까.',
};

const namiya: BookScenario = {
  match: (t) => t.includes('나미야') || t.includes('잡화점'),
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '아토우야',
      emoji: '📬',
      greeting:
        '이 잡화점에 온 건 우연이 아니야. 너에게도 누군가에게 물어보고 싶지만 혼자서는 결정 못 내릴 고민 있지? 한번 말해봐.',
      chips: ['진로 고민이 있어요', '친구 문제가 있어요', '비밀을 말하고 싶어요'],
    },
    villain: {
      role: 'villain',
      name: '미나자와',
      emoji: '🎭',
      greeting:
        '편지? 웃기지 마. 정답 같은 건 없어. 네가 과거를 바꿀 수 있다면, 뭘 바꾸고 싶어? 후회 없이 말해봐.',
      chips: ['시험 때 공부 더 할걸', '친구에게 화내지 말걸', '바꾸고 싶은 거 없어요'],
    },
    helper: {
      role: 'helper',
      name: '나미야 할아버지',
      emoji: '📮',
      greeting:
        '반갑다. 편지는 쓰는 것보다 마음을 담는 게 중요하단다. 네가 지금 누군가에게 편지를 쓴다면, 누구에게 무슨 말을 하고 싶니?',
      chips: ['부모님께 감사요', '친구에게 사과요', '미래의 나에게'],
    },
  },
  steps: [
    {
      triggers: ['진로', '고민', '미래', '나에게'],
      responses: [
        '진로라... 답이 없는 문제지. 하지만 중요한 건 네가 좋아하는 게 뭔지 아는 거야. 지금 널 가장 행복하게 하는 건 뭐야?',
        '미래의 너에게 편지라, 멋지네. 10년 뒤 네가 되고 싶은 모습은 어때? 구체적으로.',
      ],
      chips: ['아직 잘 모르겠어요', '확실하게 정해둔 게 있어요', '여러 가지 좋아하는 게 있어요'],
    },
    {
      triggers: ['친구', '사과', '화내', '비밀'],
      responses: [
        '친구 문제는 누구에게나 있어. 이 편지의 답은 정해져 있지 않아. 네가 그 친구에게 진심으로 하고 싶은 말은 뭐야?',
        '비밀을 말한다는 건 용기가 필요한 일이야. 여기서는 누구에게도 말하지 않을게. 그 비밀, 널 어떻게 만들고 있어?',
      ],
      chips: ['진심을 전해볼게요', '조금 더 생각할게요', '용기가 필요해요'],
    },
  ],
  closing:
    '편지는 답장을 받는 순간 완성돼. 네 고민, 이 카드에 담아두면 어떨까. 언제든 다시 읽어볼 수 있으니까.',
};

const cosmos: BookScenario = {
  match: (t) => t.includes('코스모스') || t.toLowerCase().includes('cosmos'),
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '칼 세이건',
      emoji: '🌌',
      greeting:
        '우리는 별을 만든 먼지야. 네 몸의 원자도 한때 별의 중심에 있었어. 그런데 넌 우주에서 가장 궁금한 게 뭐야?',
      chips: ['외계 생명체가 있을까?', '블랙홀 안엔 뭐가 있을까?', '우주 끝은 어디일까?'],
    },
    villain: {
      role: 'villain',
      name: '어둠',
      emoji: '🕳️',
      greeting:
        '나는 우주의 대부분을 차지하는 어둠이야. 네가 아무리 빛을 찾아도 결국 나로 돌아와. 그래도 계속 살 가치가 있다고 생각해?',
      chips: ['빛이 있으니까 살 가치 있어요', '어둠도 필요한 거겠죠', '두려워요'],
    },
    helper: {
      role: 'helper',
      name: '보이저 호',
      emoji: '🛰️',
      greeting:
        '나는 지구를 떠나 우주로 떠난 탐사선이야. 40년째 날아가고 있지. 너도 어딘가로 떠나고 싶다면, 어디로 가고 싶어?',
      chips: ['다른 행성으로!', '과거로 돌아가고 싶어요', '미래로 가고 싶어요'],
    },
  },
  steps: [
    {
      triggers: ['외계', '생명체', '블랙홀', '끝', '궁금'],
      responses: [
        '좋은 질문이야. 과학은 모르는 것을 인정하는 데서 시작해. 난 외계 생명체가 있을 거라 믿어. 우주가 너무 넓으니까. 넌 어떻게 생각해?',
        '블랙홀 안은 아무도 몰라. 그게 과학의 매력이지. 모르는 걸 인정하고 탐구하는 거. 네가 과학자라면 뭘 연구하고 싶어?',
      ],
      chips: ['저도 있을 것 같아요', '없을 수도 있지 않을까요?', '직접 보고 싶어요'],
    },
    {
      triggers: ['빛', '살 가치', '어둠', '두려', '떠나', '행성', '미래'],
      responses: [
        '아름다운 답변이야. 우주는 차갑지만, 우리가 의미를 부여하면 따뜻해져. 네가 우주에서 가장 의미 있다고 느끼는 건 뭐야?',
        '떠나고 싶다는 건 곧 성장하고 싶다는 뜻이야. 보이저 호도 그렇게 시작했어. 네 여행의 첫걸음은 뭐가 될까?',
      ],
      chips: ['사람들이에요', '배움이에요', '아직 찾는 중이에요'],
    },
  ],
  closing:
    '우리는 별을 만든 먼지이고, 우주가 자신을 이해하는 방법이야. 이 대화를 카드로 남기면, 네 우주가 조금 더 넓어질 거야.',
};

const demian: BookScenario = {
  match: (t) => t.includes('데미안') || t.toLowerCase().includes('demian'),
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '싱클레어',
      emoji: '🥚',
      greeting:
        '난 두 세계 사이에서 자라왔어. 밝은 세계와 어두운 세계. 너도 겉으론 착한 학생이지만, 속엔 다른 네가 있지 않아?',
      chips: ['가끔 다른 제가 있어요', '저는 그냥 저예요', '그런 적 없어요'],
    },
    villain: {
      role: 'villain',
      name: '크노르',
      emoji: '🌑',
      greeting:
        '나는 네가 두려워하는 어둠이야. 하지만 네가 날 외면하면 할수록 커지지. 네 안의 어둠, 한번 마주해볼래?',
      chips: ['마주해볼게요', '아직 두려워요', '어둠이 뭔지 모르겠어요'],
    },
    helper: {
      role: 'helper',
      name: '데미안',
      emoji: '🐦',
      greeting:
        '각자의 길을 찾는 건 쉽지 않아. 새가 알에서 나오려면 알 하나를 부수야 해. 넌 지금 무엇을 깨고 나오고 싶어?',
      chips: ['부모님 기대에서', '낯선 두려움에서', '아직 모르겠어요'],
    },
  },
  steps: [
    {
      triggers: ['다른', '어둠', '두려', '마주', '깨', '기대'],
      responses: [
        '그 두려움이 바로 네가 성장하고 있다는 증거야. 알을 깨는 건 아파. 하지만 그래야 날 수 있어. 넌 무엇을 위해 날고 싶어?',
        '부모님의 기대에서 벗어난다는 건 부모님을 사랑하지 않는다는 뜻이 아니야. 네 길을 찾는 거지. 네 길은 어떤 모습이야?',
      ],
      chips: ['제 길을 찾고 싶어요', '아직 두려워요', '생각할 시간이 필요해요'],
    },
    {
      triggers: ['그냥', '모르', '시간', '생각'],
      responses: [
        '모른다는 건 솔직한 거야. 싱클레어도 오래 헤맸거든. 중요한 건 멈추지 않는 거야. 넌 지금 무엇에 집중하고 있어?',
        '시간은 괜찮아. 하지만 너 자신을 속이지는 마. 네가 진짜 원하는 건 뭐야? 남이 원하는 게 아니라.',
      ],
      chips: ['제가 원하는 걸 찾아볼게요', '솔직해지고 싶어요', '조금씩 알아갈게요'],
    },
  ],
  closing:
    '네 안의 새가 알을 깨고 나오는 중이야. 이 대화를 카드로 남겨두면, 그날 네가 누구였는지 기억할 수 있어.',
};

const SCENARIOS: BookScenario[] = [
  harryPotter,
  littlePrince,
  namiya,
  cosmos,
  demian,
];

// --- Generic fallback scenario for unknown books ---

const genericScenario: BookScenario = {
  match: () => true,
  characters: {
    protagonist: {
      role: 'protagonist',
      name: '주인공',
      emoji: '🧑',
      greeting:
        '이 책에서 난 정말 많은 일을 겪었어. 너도 내 이야기를 읽으면서 가장 공감했거나 반발했던 부분이 있어?',
      chips: ['주인공의 선택에 공감했어요', '이해 안 가는 행동이 있었어요', '결말이 아쉬웠어요'],
    },
    villain: {
      role: 'villain',
      name: '악당',
      emoji: '😈',
      greeting:
        '사람들은 날 나쁘다고 해. 하지만 나도 내 이유가 있어. 넌 내 입장이 되어본 적 있어? 정말 나쁜 건 뭘까?',
      chips: ['이해하려 해봤어요', '절대 못 용서할 것 같아요', '상황이 그렇게 만든 것 같아요'],
    },
    helper: {
      role: 'helper',
      name: '조력자',
      emoji: '🧙',
      greeting:
        '주인공 곁에서 도왔지만, 사실 나도 배웠어. 넌 누군가를 도우면서 스스로도 배운 적 있어?',
      chips: ['가르치며 배운 적 있어요', '도와주는 걸 좋아해요', '혼자 하는 게 편해요'],
    },
  },
  steps: [
    {
      triggers: ['공감', '선택', '이해', '반발', '아쉬'],
      responses: [
        '그렇게 느꼈다면 네가 이미 이 책의 일부가 된 거야. 책은 읽는 사람에 따라 달라지거든. 넌 이 책에서 가장 기억에 남는 장면이 뭐야?',
        '반발도 감정이야. 그 감정이 생겼다는 건 네가 진지하게 읽었다는 뜻이지. 네가 주인공이라면 어떻게 했을 것 같아?',
      ],
      chips: ['저라면 다르게 했을 것 같아요', '비슷하게 했을 것 같아요', '상황이라서 어쩔 수 없었어요'],
    },
    {
      triggers: ['입장', '도와', '가르', '혼자', '편'],
      responses: [
        '다른 사람의 입장이 되어본다는 건 어려운 일이야. 하지만 그게 성장하는 거지. 네가 주인공에게 한마디 한다면 뭐라고 할래?',
        '도우면서 배운다는 건 멋진 일이야. 이 책에서 네가 가장 배운 점은 뭐야?',
      ],
      chips: ['용기를 배웠어요', '인내를 배웠어요', '사랑을 배웠어요'],
    },
  ],
  closing:
    '이 책과 네 이야기가 만났어. 이 대화를 카드로 남겨두면, 다음에 다시 읽을 때 새로운 너를 만날 수 있을 거야.',
};

export function getScenario(title: string): BookScenario {
  return SCENARIOS.find((s) => s.match(title)) ?? genericScenario;
}

export function getCharacter(title: string, role: CharacterRole): CharacterProfile {
  return getScenario(title).characters[role];
}

// Generate a response based on user input and conversation step
export function generateResponse(
  title: string,
  userText: string,
  turn: number
): { text: string; chips: string[]; isClosing: boolean } {
  const scenario = getScenario(title);
  const stepIdx = Math.min(turn, scenario.steps.length - 1);
  const step = scenario.steps[stepIdx];

  const lower = userText.toLowerCase();
  const matchedStep = scenario.steps.find((s) =>
    s.triggers.some((t) => lower.includes(t.toLowerCase()))
  );

  const useStep = matchedStep ?? step;
  const responseIdx = turn % useStep.responses.length;
  const text = useStep.responses[responseIdx];
  const chips = useStep.chips;

  // After 2 user turns, offer closing
  const isClosing = turn >= 2;

  if (isClosing) {
    return { text, chips, isClosing: true };
  }
  return { text, chips, isClosing: false };
}

export function getClosing(title: string): string {
  return getScenario(title).closing;
}
