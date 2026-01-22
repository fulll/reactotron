import React, { useContext, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { ContentView, ReactotronContext, EmptyState } from "reactotron-core-ui"
import { MdNetworkCheck } from "react-icons/md"
import { useDrawerResize } from "../network/useDrawerResize"
import { NetworkRequestsList } from "../network/components/NetworkRequestsList"
import { NetworkRequestHeader } from "../network/components/NetworkRequestHeader"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const ResizableSectionWrapper = styled.div`
  display: grid;
  height: 100%;
  position: relative;
  overflow: hidden;
`

const RequestResponseContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: ${(props) => props.theme.background};
`

const RequestResponseContainerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${(props) => props.theme.background};
  display: flex;
  flex-direction: column;
`

const ResizeHandle = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: col-resize;
  z-index: 10;
  background-color: transparent;

  &:hover {
    background-color: ${(props) => props.theme.tag};
  }

  &:active {
    background-color: ${(props) => props.theme.tag};
  }
`

const RawJsonToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid ${(props) => props.theme.border};
  background-color: ${(props) => props.theme.backgroundSubtleDark};
  font-size: 13px;
  color: ${(props) => props.theme.foregroundDark};
  user-select: none;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) => props.theme.backgroundSubtleDark};
    transition: 0.3s;
    border-radius: 24px;
    border: 1px solid ${(props) => props.theme.border};
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: ${(props) => props.theme.foregroundDark};
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: ${(props) => props.theme.tag};
  }

  input:checked + .slider:before {
    transform: translateX(20px);
    background-color: ${(props) => props.theme.background};
  }
`

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`

export const NetworkView = () => {
  const hasUserResizedRef = useRef(false)
  const resizeTimeoutRef = useRef<NodeJS.Timeout>()

  const { commands } = useContext(ReactotronContext)

  const [currentCommandId, setCurrentCommandId] = useState<number>()
  const [currSelectedType, setCurrSelectedType] = useState<string>("request headers")
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)
  const [showRawJson, setShowRawJson] = useState(false)

  const filteredCommands = commands.filter((command) => command.type === "api.response")

  useEffect(() => {
    const handleResize = () => {
      if (hasUserResizedRef.current) return
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)

      resizeTimeoutRef.current = setTimeout(() => {
        setScreenWidth(window.innerWidth)
      }, 150)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  const initialLeftPanelWidth = Math.floor((screenWidth * 7) / 12)
  const minRightPanelWidth = Math.floor(screenWidth / 12)

  const { containerRef, leftPanelWidth, handleMouseDown } = useDrawerResize({
    initialLeftPanelWidth,
    minLeftPanelWidth: 400,
    minRightPanelWidth,
    resizeHandleWidth: 10,
    onUserResize: () => {
      hasUserResizedRef.current = true
    },
  })

  useEffect(() => {
    if (!currentCommandId && filteredCommands.length > 0) {
      setCurrentCommandId(filteredCommands[0].messageId)
    }
  }, [currentCommandId, filteredCommands])

  const currentCommand = filteredCommands.find((command) => command.messageId === currentCommandId)

  const tabContent = {
    "request headers": currentCommand?.payload?.request?.headers,
    "request params": currentCommand?.payload?.request?.params,
    "request body": currentCommand?.payload?.request?.data,
    "response body": currentCommand?.payload?.response?.body,
    "response headers": currentCommand?.payload?.response?.headers,
  }

  if (filteredCommands.length === 0) {
    return (
      <Container>
        <EmptyState icon={MdNetworkCheck} title="No Network Activity">
          <p>Network requests will appear here once your app starts making API calls.</p>
        </EmptyState>
      </Container>
    )
  }

  return (
    <Container>
      <ResizableSectionWrapper
        ref={containerRef}
        style={{ gridTemplateColumns: `${leftPanelWidth}px 1fr` }}
      >
        {containerRef.current && (
          <NetworkRequestsList
            filteredCommands={filteredCommands}
            containerHeight={containerRef.current?.offsetHeight}
            currentCommandId={currentCommandId}
            onRequestClick={setCurrentCommandId}
          />
        )}
        <RequestResponseContainer>
          <ResizeHandle onMouseDown={handleMouseDown} />
          <NetworkRequestHeader
            currSelectedType={currSelectedType}
            onTabChange={(tab) => {
              setCurrSelectedType(tab)
              if (tab !== "response body") {
                setShowRawJson(false)
              }
            }}
            tabContent={tabContent}
          />
          {currentCommandId && (
            <RequestResponseContainerBody key={currentCommandId}>
              {currSelectedType === "response body" && (
                <RawJsonToggleContainer>
                  <span>Raw JSON</span>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={showRawJson}
                      onChange={() => setShowRawJson(!showRawJson)}
                    />
                    <span className="slider"></span>
                  </ToggleSwitch>
                </RawJsonToggleContainer>
              )}
              <ContentWrapper>
                {showRawJson && currSelectedType === "response body" ? (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "Monaco, Menlo, Consolas, monospace",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      userSelect: "text",
                      cursor: "text",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#cbd5e0",
                    }}
                  >
                    {JSON.stringify(tabContent[currSelectedType], null, 2)}
                  </pre>
                ) : (
                  <ContentView value={tabContent[currSelectedType]} />
                )}
              </ContentWrapper>
            </RequestResponseContainerBody>
          )}
        </RequestResponseContainer>
      </ResizableSectionWrapper>
    </Container>
  )
}
