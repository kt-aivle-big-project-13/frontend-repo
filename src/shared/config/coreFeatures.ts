import type { ComponentType } from 'react';
import type { IconProps } from '@tabler/icons-react';
import {
  IconRadar2,
  IconShieldCheck,
  IconFileText,
  IconUser,
  IconLayoutDashboard,
} from '@tabler/icons-react';

export interface CoreFeature {
  title: string;
  description: string;
  to: string;
  icon: ComponentType<IconProps>;
}

export const CORE_FEATURES: CoreFeature[] = [
  {
    title: '① 고영향 AI 사전진단',
    description: '모델이 고영향 AI인지 판단 가능합니다.',
    to: '/features#feature-01',
    icon: IconRadar2,
  },
  {
    title: '② 신뢰성 검증·규제대응',
    description: 'AI 기본법 조항을 충족하는지 자동 감사할 수 있습니다.',
    to: '/features#feature-02',
    icon: IconShieldCheck,
  },
  {
    title: '③ 산출물(보고서) 자동 생성',
    description:
      '설명가능성·공정성 진단 보고서 등 산출물을 자동으로 생성할 수 있습니다.',
    to: '/features#feature-03',
    icon: IconFileText,
  },
  {
    title: '④ 이의제기 대응문서',
    description: '고객의 이의제기 관련 대응 의견을 초안 작성할 수 있습니다.',
    to: '/features#feature-04',
    icon: IconUser,
  },
  {
    title: '⑤ 운영 대시보드',
    description: '최종으로 산출된 결과물을 대시보드로 볼 수 있습니다.',
    to: '/features#feature-05',
    icon: IconLayoutDashboard,
  },
];