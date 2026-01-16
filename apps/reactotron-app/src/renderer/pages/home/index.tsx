import React, { useContext, useMemo } from "react"
import { Header } from "reactotron-core-ui"
import styled, { keyframes } from "styled-components"
import { useNavigate } from "react-router-dom"

import StandaloneContext from "../../contexts/Standalone"
import {
  getPlatformName,
  getPlatformDetails,
  getScreen,
  getIcon,
  getConnectionName,
} from "../../util/connectionHelpers"
import { Connection } from "../../contexts/Standalone/useStandalone"
import Welcome from "./welcome"
import AndroidDeviceHelp from "../help/components/AndroidDeviceHelp"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`
const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  overflow-y: scroll;
  gap: 20px;
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
`

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`

const ConnectionCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 12px;
  background: ${(props) => props.theme.backgroundSubtleLight || props.theme.background};
  border: 1px solid ${(props) => props.theme.line};
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.2),
      0 10px 10px -5px rgba(0, 0, 0, 0.1);
    border-color: ${(props) => props.theme.tag};
    animation: ${floatAnimation} 2s ease-in-out infinite;

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-6px) scale(1.01);
  }
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`

const IconContainer = styled.div`
  color: ${(props) => props.theme.tag};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  ${ConnectionCard}:hover & {
    transform: rotate(5deg) scale(1.1);
  }
`

const AppName = styled.div`
  color: ${(props) => props.theme.tag};
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const InfoLabel = styled.div`
  color: ${(props) => props.theme.foregroundDark};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`

const InfoValue = styled.div`
  color: ${(props) => props.theme.foregroundLight};
  font-size: 14px;
`

const ScreenInfo = styled.div`
  color: ${(props) => props.theme.backgroundHighlight};
  font-size: 13px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid ${(props) => props.theme.subtleLine};
`

function ConnectionCell({ connection }: { connection: Connection }) {
  const navigate = useNavigate()
  const { selectConnection } = useContext(StandaloneContext)

  const [ConnectionIcon, platformName, platformDetails, connectionName, screen] = useMemo(() => {
    return [
      getIcon(connection),
      getPlatformName(connection),
      getPlatformDetails(connection),
      getConnectionName(connection),
      getScreen(connection),
    ]
  }, [connection])

  const handleClick = () => {
    selectConnection(connection.clientId)
    navigate("/timeline")
  }

  return (
    <ConnectionCard onClick={handleClick}>
      <CardHeader>
        <IconContainer>
          <ConnectionIcon size={40} />
        </IconContainer>
        <AppName>{connectionName}</AppName>
      </CardHeader>
      <CardBody>
        <InfoRow>
          <InfoLabel>Platform</InfoLabel>
          <InfoValue>
            {platformName} {platformDetails}
          </InfoValue>
        </InfoRow>
        {screen && <ScreenInfo>📱 {screen}</ScreenInfo>}
      </CardBody>
    </ConnectionCard>
  )
}

function Connections() {
  const { connections } = useContext(StandaloneContext)

  return (
    <Container>
      <Header title="Connections" isDraggable />
      <ContentContainer>
        {connections.length > 0 ? (
          <CardsGrid>
            {connections.map((connection) => (
              <ConnectionCell key={connection.clientId} connection={connection} />
            ))}
          </CardsGrid>
        ) : (
          <Welcome />
        )}
        <AndroidDeviceHelp />
      </ContentContainer>
    </Container>
  )
}

export default Connections
