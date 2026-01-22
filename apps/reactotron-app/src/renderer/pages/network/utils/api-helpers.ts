function rightPad(value: string, length: number): string {
  while (value.length < length) {
    value += " "
  }
  return value
}

function tableToMarkdown(table: Record<string, any>): string {
  const lines = []

  let keyLength = 0
  let valueLength = 0
  for (const key in table) {
    keyLength = Math.max(keyLength, key.length)
    valueLength = Math.max(valueLength, (table[key] || "").toString().length)
  }

  const keyPad = (value = "") => rightPad(value, keyLength)
  const valuePad = (value = "") => rightPad(value, valueLength)
  const add = (key = "", value = "") =>
    lines.push(`${keyPad(key || "")} | ${valuePad(value || "")}`)

  add("Key", "Value")
  add(Array(keyLength + 1).join("-"), Array(valueLength + 1).join("-"))

  for (const key in table) {
    add(key, table[key])
  }

  return lines.join("\n")
}

export function apiToMarkdown(payload: any = {}): string {
  const lines = []
  const request = payload.request || {}
  const response = payload.response || {}
  const { method, url, headers, data, params } = request

  lines.push("# API")
  lines.push("")
  lines.push(`\`${method || "GET"}\` \`${url || ""}\``)
  lines.push("")

  // request data
  if (data) {
    let requestData = data
    try {
      if (typeof data === "string") {
        requestData = JSON.parse(requestData)
      }
      requestData = JSON.stringify(requestData, null, 2)
    } catch (e) {}

    if (requestData) {
      lines.push("# Request")
      lines.push("")
      lines.push("```json")
      lines.push(requestData)
      lines.push("```")
    }
  }

  // request headers
  if (headers && Object.keys(headers).length > 0) {
    lines.push("")
    lines.push("### Request Headers")
    lines.push("")
    lines.push(tableToMarkdown(headers))
  }

  // request params
  if (params && Object.keys(params).length > 0) {
    lines.push("")
    lines.push("### Request Params")
    lines.push("")
    lines.push(tableToMarkdown(params))
  }

  // response
  if (response) {
    lines.push("")
    lines.push("# Response")

    if (response.status) {
      lines.push("")
      lines.push("### Status Code")
      lines.push("")
      lines.push(`\`${response.status}\``)
    }

    if (response.body) {
      let body = response.body
      try {
        if (typeof body === "string") {
          body = JSON.parse(body)
        }
        body = JSON.stringify(body, null, 2)
      } catch (e) {}

      if (body) {
        lines.push("")
        lines.push("### Data Received")
        lines.push("")
        lines.push("```json")
        lines.push(body)
        lines.push("```")
      }
    }

    if (response.headers && Object.keys(response.headers).length > 0) {
      lines.push("")
      lines.push("### Headers")
      lines.push("")
      lines.push(tableToMarkdown(response.headers))
    }
  }

  lines.push("")
  return lines.join("\n")
}

export function apiRequestToCurl(payload: any = {}): string {
  const output = []
  const request = payload.request || {}
  const { method, headers, data, url } = request

  if (method === "GET") {
    output.push("curl")
  } else {
    output.push(`curl -X ${method} `)
  }

  for (const header in headers) {
    output.push(` -H "${header}:${headers[header]}"`)
  }

  output.push(` ${url}`)

  if (data) {
    let parsedData = data
    try {
      if (typeof data === "string") {
        parsedData = JSON.parse(parsedData)
      }
      parsedData = JSON.stringify(parsedData)
    } catch (e) {}
    output.push(` -d '${parsedData}'`)
  }

  return output.join("")
}
