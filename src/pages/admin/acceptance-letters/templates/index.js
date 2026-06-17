import ClassicTemplate from './ClassicTemplate.jsx'
import TechBoxTemplate from './TechBoxTemplate.jsx'
import HeritageTemplate from './HeritageTemplate.jsx'
import GiftBoxTemplate from './GiftBoxTemplate.jsx'
import TicketTemplate from './TicketTemplate.jsx'
import BannerTemplate from './BannerTemplate.jsx'
import EditorialTemplate from './EditorialTemplate.jsx'
import SpaceTechTemplate from './SpaceTechTemplate.jsx'

export const LAYOUT_TYPES = {
  CLASSIC: 'classic',
  TECH_BOX: 'tech-box',
  HERITAGE: 'heritage',
  GIFT_BOX: 'gift-box',
  TICKET: 'ticket',
  BANNER: 'banner',
  EDITORIAL: 'editorial',
  SPACE_TECH: 'space-tech',
}

const TEMPLATE_REGISTRY = {
  [LAYOUT_TYPES.CLASSIC]: ClassicTemplate,
  [LAYOUT_TYPES.TECH_BOX]: TechBoxTemplate,
  [LAYOUT_TYPES.HERITAGE]: HeritageTemplate,
  [LAYOUT_TYPES.GIFT_BOX]: GiftBoxTemplate,
  [LAYOUT_TYPES.TICKET]: TicketTemplate,
  [LAYOUT_TYPES.BANNER]: BannerTemplate,
  [LAYOUT_TYPES.EDITORIAL]: EditorialTemplate,
  [LAYOUT_TYPES.SPACE_TECH]: SpaceTechTemplate,
}

export function getTemplateByLayout(layout) {
  return TEMPLATE_REGISTRY[layout] || ClassicTemplate
}
