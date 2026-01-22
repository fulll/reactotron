import React from "react"
import styled from "styled-components"
import { VirtualizedList } from "./VirtualizedList"
import Styles from "../network.styles"
import { Command, CommandTypeKey } from "reactotron-core-contract"
import { MdCallReceived, MdReceipt, MdContentCopy } from "react-icons/md"
import { clipboard } from "electron"
import { apiToMarkdown, apiRequestToCurl } from "../utils/api-helpers"

interface NetworkRequestsListProps {
  filteredCommands: Command<CommandTypeKey, any>[]
  containerHeight: number
  currentCommandId?: number
  onRequestClick: (messageId: number) => void
  overscan?: number
}

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  position: absolute;
  left: 170px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  background: ${(props) => props.theme.backgroundSubtleLight};
  padding: 4px;
  border-radius: 4px;
  z-index: 10;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: ${(props) => props.theme.backgroundLighter};
  color: ${(props) => props.theme.foregroundDark};
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => props.theme.tag};
    color: ${(props) => props.theme.background};
    transform: scale(1.1);
  }

  svg {
    font-size: 14px;
  }
`

const RequestItemWrapper = styled.div`
  &:hover ${ActionButtons} {
    opacity: 1;
  }
`

const formatTime = (date: Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const formatSize = (bytes: number) => {
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

const {
  RequestContainer,
  RequestItem,
  RequestTableHeader,
  RequestTableHeaderCell,
  RequestTableCell,
} = Styles

export const NetworkRequestsList: React.FC<NetworkRequestsListProps> = ({
  filteredCommands,
  containerHeight,
  currentCommandId,
  onRequestClick,
  overscan = 5,
}) => {
  return (
    <RequestContainer>
      <RequestTableHeader>
        <RequestTableHeaderCell width="80px">Time</RequestTableHeaderCell>
        <RequestTableHeaderCell width="70px">Method</RequestTableHeaderCell>
        <RequestTableHeaderCell width="flex">URL</RequestTableHeaderCell>
        <RequestTableHeaderCell width="70px">Status</RequestTableHeaderCell>
        <RequestTableHeaderCell width="100px">Size</RequestTableHeaderCell>
      </RequestTableHeader>
      <VirtualizedList
        getKey={(item) => item.messageId.toString()}
        data={filteredCommands}
        itemHeight={50}
        height={containerHeight - 40}
        overscan={overscan}
        renderItem={(command) => {
          const payloadBuffer = Buffer.from(JSON.stringify(command.payload), "utf8")
          const payloadSize = payloadBuffer.byteLength

          const shortenedUrl =
            command.payload?.request?.url?.split("://")[1] || command.payload?.request?.url || "N/A"

          const method = command.payload?.request?.method?.toUpperCase() || "N/A"
          const status = command.payload?.response?.status || "N/A"
          const time = formatTime(command.date)

          const handleCopyResponse = (e: React.MouseEvent) => {
            e.stopPropagation()
            const text = JSON.stringify(command.payload.response.body, null, 2)
            clipboard.writeText(text)
          }

          const handleCopyMarkdown = (e: React.MouseEvent) => {
            e.stopPropagation()
            const text = apiToMarkdown(command.payload)
            clipboard.writeText(text)
          }

          const handleCopyCurl = (e: React.MouseEvent) => {
            e.stopPropagation()
            const text = apiRequestToCurl(command.payload)
            clipboard.writeText(text)
          }

          return (
            <RequestItemWrapper key={command?.messageId}>
              <RequestItem
                onClick={() => onRequestClick(command?.messageId)}
                className={currentCommandId === command?.messageId ? "active" : ""}
              >
                <RequestTableCell width="80px">{time}</RequestTableCell>
                <RequestTableCell width="70px" method={method}>
                  {method}
                </RequestTableCell>
                <RequestTableCell width="flex" title={command.payload?.request?.url}>
                  {shortenedUrl}
                </RequestTableCell>
                <RequestTableCell width="70px" status={status}>
                  {status}
                </RequestTableCell>
                <RequestTableCell width="100px" title={`${payloadSize} bytes`}>
                  {formatSize(payloadSize)}
                </RequestTableCell>
                <ActionButtons>
                  <IconButton onClick={handleCopyResponse} title="Copy JSON response to clipboard">
                    <MdCallReceived />
                  </IconButton>
                  <IconButton onClick={handleCopyMarkdown} title="Copy as markdown to clipboard">
                    <MdReceipt />
                  </IconButton>
                  <IconButton onClick={handleCopyCurl} title="Copy JSON request as cURL">
                    <MdContentCopy />
                  </IconButton>
                </ActionButtons>
              </RequestItem>
            </RequestItemWrapper>
          )
        }}
      />
    </RequestContainer>
  )
}
