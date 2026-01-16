import React, { useCallback, useContext, useMemo, useState } from "react"
import { clipboard, shell } from "electron"
import fs from "fs"
import os from "os"
import path from "path"
import debounce from "lodash.debounce"
import {
  Header,
  filterCommands,
  TimelineFilterModal,
  timelineCommandResolver,
  EmptyState,
  ReactotronContext,
  TimelineContext,
  RandomJoke,
} from "reactotron-core-ui"
import { CommandType } from "reactotron-core-contract"
import {
  MdSearch,
  MdDeleteSweep,
  MdFilterList,
  MdSwapVert,
  MdReorder,
  MdDownload,
  MdViewModule,
  MdDescription,
  MdWifi,
  MdPlayArrow,
} from "react-icons/md"
import { FaTimes } from "react-icons/fa"
import styled from "styled-components"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`
const TimelineContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`
const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  padding-top: 4px;
  padding-right: 10px;
`
const SearchLabel = styled.p`
  padding: 0 10px;
  font-size: 14px;
  color: ${(props) => props.theme.foregroundDark};
`
const SearchInput = styled.input`
  border-radius: 4px;
  padding: 10px;
  flex: 1;
  background-color: ${(props) => props.theme.backgroundSubtleDark};
  border: none;
  color: ${(props) => props.theme.foregroundDark};
  font-size: 14px;
`
const HelpMessage = styled.div`
  margin: 0 40px;
`
const QuickStartButtonContainer = styled.div`
  display: flex;
  padding: 4px 8px;
  margin: 30px 20px;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${(props) => props.theme.backgroundLighter};
  color: ${(props) => props.theme.foreground};
  align-items: center;
  justify-content: center;
  text-align: center;
`
const Divider = styled.div`
  height: 1px;
  background-color: ${(props) => props.theme.foregroundDark};
  margin: 40px 10px;
`

export const ButtonContainer = styled.div`
  padding: 10px;
  cursor: pointer;
`

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid ${(props) => props.theme.line};
  background-color: ${(props) => props.theme.backgroundSubtleDark};
`

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background-color: ${(props) =>
    props.$active ? props.theme.tag : props.theme.backgroundSubtleLight || props.theme.background};
  color: ${(props) => (props.$active ? props.theme.background : props.theme.foregroundLight)};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${(props) => (props.$active ? props.theme.tag : props.theme.line)};

  &:hover {
    background-color: ${(props) =>
      props.$active ? props.theme.tag : props.theme.backgroundLighter};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 18px;
  }
`

type TabType = "all" | "logs" | "network" | "actions"

const LogFiltersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  border-bottom: 1px solid ${(props) => props.theme.line};
  background-color: ${(props) => props.theme.backgroundSubtleLight || props.theme.background};
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: ${(props) => props.theme.foregroundLight};
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  transition: color 0.2s ease;

  &:hover {
    color: ${(props) => props.theme.tag};
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: ${(props) => props.theme.tag};
  }
`

type LogLevel = "debug" | "warn" | "error"

function Timeline() {
  const { sendCommand, clearCommands, commands, openDispatchModal } = useContext(ReactotronContext)
  const {
    isSearchOpen,
    toggleSearch,
    closeSearch,
    setSearch,
    search,
    isReversed,
    toggleReverse,
    openFilter,
    closeFilter,
    isFilterOpen,
    hiddenCommands,
    setHiddenCommands,
  } = useContext(TimelineContext)

  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [logLevels, setLogLevels] = useState<Set<LogLevel>>(new Set(["debug", "warn", "error"]))

  const toggleLogLevel = (level: LogLevel) => {
    setLogLevels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(level)) {
        newSet.delete(level)
      } else {
        newSet.add(level)
      }
      return newSet
    })
  }

  const filterByTab = useCallback(
    (commands: any[]) => {
      switch (activeTab) {
        case "logs":
          return commands.filter((cmd) => {
            if (cmd.type !== CommandType.Log) return false
            // Filter by selected log levels
            if (logLevels.size === 0) return false
            const level = cmd.payload?.level || "debug"
            return logLevels.has(level as LogLevel)
          })
        case "network":
          return commands.filter((cmd) => cmd.type === CommandType.ApiResponse)
        case "actions":
          return commands.filter((cmd) => cmd.type === CommandType.StateActionComplete)
        case "all":
        default:
          return commands
      }
    },
    [activeTab, logLevels]
  )

  let filteredCommands
  try {
    filteredCommands = filterCommands(commands, search, hiddenCommands)
    filteredCommands = filterByTab(filteredCommands)
  } catch (error) {
    console.error(error)
    filteredCommands = commands
  }

  if (isReversed) {
    filteredCommands = filteredCommands.reverse()
  }

  const dispatchAction = (action: any) => {
    sendCommand("state.action.dispatch", { action })
  }

  function openDocs() {
    shell.openExternal("https://docs.infinite.red/reactotron/quick-start/react-native/")
  }

  function downloadLog() {
    const homeDir = os.homedir()
    const downloadDir = path.join(homeDir, "Downloads")
    fs.writeFileSync(
      path.resolve(downloadDir, `timeline-log-${Date.now()}.json`),
      JSON.stringify(commands || []),
      "utf8"
    )
    console.log(`Exported timeline log to ${downloadDir}`)
  }

  const { searchString, handleInputChange } = useDebouncedSearchInput(search, setSearch, 300)

  return (
    <Container>
      <Header
        title="Timeline"
        isDraggable
        actions={[
          {
            tip: "Export Log",
            icon: MdDownload,
            onClick: () => {
              downloadLog()
            },
          },
          {
            tip: "Search",
            icon: MdSearch,
            onClick: () => {
              toggleSearch()
            },
          },
          {
            tip: "Filter",
            icon: MdFilterList,
            onClick: () => {
              openFilter()
            },
          },
          {
            tip: "Reverse Order",
            icon: MdSwapVert,
            onClick: () => {
              toggleReverse()
            },
          },
          {
            tip: "Clear",
            icon: MdDeleteSweep,
            onClick: () => {
              clearCommands()
            },
          },
        ]}
      >
        {isSearchOpen && (
          <SearchContainer>
            <SearchLabel>Search</SearchLabel>
            <SearchInput autoFocus value={searchString} onChange={handleInputChange} />
            <ButtonContainer
              onClick={() => {
                if (search === "") {
                  closeSearch()
                } else {
                  setSearch("")
                }
              }}
            >
              <FaTimes size={24} />
            </ButtonContainer>
          </SearchContainer>
        )}
      </Header>
      <TabsContainer>
        <Tab $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          <MdViewModule />
          All
        </Tab>
        <Tab $active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
          <MdDescription />
          Logs
        </Tab>
        <Tab $active={activeTab === "network"} onClick={() => setActiveTab("network")}>
          <MdWifi />
          Network
        </Tab>
        <Tab $active={activeTab === "actions"} onClick={() => setActiveTab("actions")}>
          <MdPlayArrow />
          Actions
        </Tab>
      </TabsContainer>
      {activeTab === "logs" && (
        <LogFiltersContainer>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={logLevels.has("debug")}
              onChange={() => toggleLogLevel("debug")}
            />
            Debug
          </CheckboxLabel>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={logLevels.has("warn")}
              onChange={() => toggleLogLevel("warn")}
            />
            Warn
          </CheckboxLabel>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={logLevels.has("error")}
              onChange={() => toggleLogLevel("error")}
            />
            Error
          </CheckboxLabel>
        </LogFiltersContainer>
      )}
      <TimelineContainer>
        {filteredCommands.length === 0 ? (
          <EmptyState icon={MdReorder} title="No Activity">
            <HelpMessage>
              Once your app connects and starts sending events, they will appear here.
            </HelpMessage>
            <QuickStartButtonContainer onClick={openDocs}>
              Check out the quick start guide here!
            </QuickStartButtonContainer>
            <Divider />
            <RandomJoke />
          </EmptyState>
        ) : (
          filteredCommands.map((command) => {
            const CommandComponent = timelineCommandResolver(command.type)

            if (CommandComponent) {
              return (
                <CommandComponent
                  key={command.messageId}
                  command={command}
                  copyToClipboard={clipboard.writeText}
                  readFile={(path) => {
                    return new Promise((resolve, reject) => {
                      fs.readFile(path, "utf-8", (err, data) => {
                        if (err || !data) reject(new Error("Something failed"))
                        else resolve(data)
                      })
                    })
                  }}
                  sendCommand={sendCommand}
                  dispatchAction={dispatchAction}
                  openDispatchDialog={openDispatchModal}
                />
              )
            }

            return null
          })
        )}
      </TimelineContainer>
      <TimelineFilterModal
        isOpen={isFilterOpen}
        onClose={() => {
          closeFilter()
        }}
        hiddenCommands={hiddenCommands}
        setHiddenCommands={setHiddenCommands}
      />
    </Container>
  )
}

export default Timeline

const useDebouncedSearchInput = (
  initialValue: string,
  setSearch: (search: string) => void,
  delay: number = 300
) => {
  const [searchString, setSearchString] = React.useState<string>(initialValue)
  const debouncedOnChange = useMemo(() => debounce(setSearch, delay), [delay, setSearch])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      setSearchString(value)
      debouncedOnChange(value)
    },
    [debouncedOnChange]
  )

  return {
    searchString,
    handleInputChange,
  }
}
