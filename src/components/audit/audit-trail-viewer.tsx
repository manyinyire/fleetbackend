"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { AuditLogDetails } from "./audit-log-details";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditTrailViewerProps {
  auditLogs: AuditLog[];
}

const ACTION_META: Record<string, { icon: any; color: string }> = {
  CREATE: { icon: CheckCircle2, color: "green" },
  CREATED: { icon: CheckCircle2, color: "green" },
  UPDATE: { icon: Info, color: "blue" },
  UPDATED: { icon: Info, color: "blue" },
  DELETE: { icon: AlertTriangle, color: "red" },
  DELETED: { icon: AlertTriangle, color: "red" },
  LOGIN: { icon: LogIn, color: "purple" },
  LOGOUT: { icon: LogOut, color: "purple" },
  SMS_SENT: { icon: MessageSquare, color: "yellow" },
  EMAIL_SENT: { icon: Mail, color: "yellow" },
  BULK_SMS_SENT: { icon: MessageSquare, color: "yellow" },
};

const FALLBACK_META = { icon: FileText, color: "gray" };

const formatActionDescription = (log: AuditLog) => {
  const entityType = log.entityType.replace(/_/g, " ").toLowerCase();

  switch (log.action) {
    case "CREATE":
      return `Created new ${entityType}`;
    case "UPDATE":
      return `Updated ${entityType}`;
    case "DELETE":
      return `Deleted ${entityType}`;
    case "LOGIN":
      return "User logged in";
    case "LOGOUT":
      return "User logged out";
    case "SMS_SENT":
      return "SMS notification sent";
    case "EMAIL_SENT":
      return "Email notification sent";
    case "BULK_SMS_SENT":
      return "Bulk SMS notifications sent";
    default:
      return `${log.action.replace(/_/g, " ").toLowerCase()} ${entityType}`;
  }
};

export function AuditTrailViewer({ auditLogs }: AuditTrailViewerProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const disclosure = useDisclosure();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  if (auditLogs.length === 0) {
    return (
      <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} py={16} textAlign="center">
        <Icon as={Clock} boxSize={12} color="gray.400" />
        <Text mt={3} fontSize="lg" fontWeight="semibold">
          No audit logs yet
        </Text>
        <Text mt={2} fontSize="sm" color="gray.500">
          Activities will appear here once users interact with the system.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={4}>
        {auditLogs.map((log) => {
          const meta = ACTION_META[log.action] ?? FALLBACK_META;

          return (
            <Box
              key={log.id}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={5}
              _hover={{ bg: hoverBg, cursor: "pointer" }}
              onClick={() => {
                setSelectedLog(log);
                disclosure.onOpen();
              }}
            >
              <HStack justify="space-between" align="flex-start">
                <HStack spacing={4} align="flex-start">
                  <Box bg={`${meta.color}.100`} color={`${meta.color}.600`} p={2} borderRadius="lg">
                    <Icon as={meta.icon} boxSize={5} />
                  </Box>
                  <Stack spacing={1}>
                    <HStack spacing={3}>
                      <Text fontWeight="semibold">{formatActionDescription(log)}</Text>
                      <Badge colorScheme={meta.color} variant="subtle" borderRadius="full">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </HStack>
                    <HStack spacing={2} fontSize="sm" color="gray.500">
                      <HStack spacing={1}>
                        <Icon as={User} boxSize={4} />
                        <Text>{log.user.name}</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack spacing={1}>
                        <Icon as={Clock} boxSize={4} />
                        <Text>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</Text>
                      </HStack>
                      {log.ipAddress && (
                        <HStack spacing={1}>
                          <Text>•</Text>
                          <Text>IP: {log.ipAddress}</Text>
                        </HStack>
                      )}
                    </HStack>
                    {log.details && typeof log.details === "object" && (
                      <Text fontSize="xs" color="gray.400">
                        {Object.keys(log.details).length} detail{Object.keys(log.details).length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </Stack>
                </HStack>
                <Button size="sm" variant="ghost" colorScheme="brand">
                  View
                </Button>
              </HStack>
            </Box>
          );
        })}
      </Stack>

      <Modal isOpen={disclosure.isOpen} onClose={disclosure.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog && <AuditLogDetails auditLog={selectedLog} isOpen onClose={disclosure.onClose} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
