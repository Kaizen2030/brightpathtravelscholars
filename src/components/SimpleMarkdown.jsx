function renderInlineMarkdown(text) {
  const nodes = []
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]?.startsWith('[')) {
      nodes.push(
        <a key={`link-${key++}`} href={match[3]} target="_blank" rel="noreferrer">
          {match[2]}
        </a>,
      )
    } else if (match[4]) {
      nodes.push(<strong key={`strong-${key++}`}>{match[4]}</strong>)
    } else if (match[5]) {
      nodes.push(<em key={`em-${key++}`}>{match[5]}</em>)
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length ? nodes : text
}

function renderParagraph(text, key) {
  return <p key={key}>{renderInlineMarkdown(text)}</p>
}

function renderList(lines, key, ordered = false) {
  const ListTag = ordered ? 'ol' : 'ul'

  return (
    <ListTag key={key}>
      {lines.map((line, index) => (
        <li key={`${key}-${index}`}>{renderInlineMarkdown(line)}</li>
      ))}
    </ListTag>
  )
}

function SimpleMarkdown({ content }) {
  const normalized = (content || '')
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <>
      {normalized.map((block, index) => {
        if (block.startsWith('### ')) {
          return <h3 key={`h3-${index}`}>{block.slice(4)}</h3>
        }

        if (block.startsWith('## ')) {
          return <h2 key={`h2-${index}`}>{block.slice(3)}</h2>
        }

        if (block.startsWith('# ')) {
          return <h1 key={`h1-${index}`}>{block.slice(2)}</h1>
        }

        if (block.startsWith('> ')) {
          return <blockquote key={`quote-${index}`}>{renderInlineMarkdown(block.slice(2))}</blockquote>
        }

        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        const unorderedItems = lines
          .filter((line) => /^[-*]\s+/.test(line))
          .map((line) => line.replace(/^[-*]\s+/, ''))

        if (unorderedItems.length === lines.length && unorderedItems.length > 0) {
          return renderList(unorderedItems, `ul-${index}`)
        }

        const orderedItems = lines
          .filter((line) => /^\d+\.\s+/.test(line))
          .map((line) => line.replace(/^\d+\.\s+/, ''))

        if (orderedItems.length === lines.length && orderedItems.length > 0) {
          return renderList(orderedItems, `ol-${index}`, true)
        }

        return renderParagraph(block, `p-${index}`)
      })}
    </>
  )
}

export default SimpleMarkdown
