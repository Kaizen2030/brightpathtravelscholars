import { getTemplateByLayout } from './templates/index.js'

export default function AcceptanceLetterTemplate({ layout, letterData, colors, universityConfig }) {
  const Template = getTemplateByLayout(layout)
  return <Template letterData={letterData} colors={colors} universityConfig={universityConfig} />
}
