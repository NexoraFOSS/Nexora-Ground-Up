import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePterodactyl } from '@/hooks/use-pterodactyl';
import { Server } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ServerConsoleProps {
  server: Server | undefined;
  isLoading: boolean;
}

export function ServerConsole({ server, isLoading }: ServerConsoleProps) {
  const { sendCommandMutation } = usePterodactyl();
  const { toast } = useToast();
  const [command, setCommand] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'Connecting to server console...',
    'Connected to server console. Welcome!',
    'Type your commands below.'
  ]);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Simulate console output
  useEffect(() => {
    if (server && server.status.toLowerCase() === 'running') {
      const messages = [
        `[Server] Server started on port ${server.port}`,
        '[INFO] Loading server properties',
        '[INFO] Starting Minecraft server',
        '[INFO] Preparing level "world"',
        '[INFO] Done! For help, type "help"'
      ];
      
      let timeoutId: NodeJS.Timeout;
      
      messages.forEach((message, index) => {
        timeoutId = setTimeout(() => {
          setConsoleOutput(prev => [...prev, message]);
        }, 600 * (index + 1));
      });
      
      return () => clearTimeout(timeoutId);
    }
  }, [server]);

  // Auto scroll to bottom of console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !server) return;

    // Add command to console output
    setConsoleOutput(prev => [...prev, `> ${command}`]);
    
    // Send command to server
    sendCommandMutation({ id: server.pterodactylId, command });
    
    // Clear command input
    setCommand('');
    
    // Simulate response
    setTimeout(() => {
      let response = 'Unknown command. Type "help" for help.';
      
      if (command.toLowerCase() === 'help') {
        response = 'Available commands: help, list, stop, restart, tps, seed';
      } else if (command.toLowerCase() === 'list') {
        response = 'There are 0/20 players online.';
      } else if (command.toLowerCase() === 'seed') {
        response = `Seed: ${Math.floor(Math.random() * 10000000000)}`;
      } else if (command.toLowerCase() === 'tps') {
        response = 'TPS: 20.0 (100%)';
      }
      
      setConsoleOutput(prev => [...prev, response]);
    }, 300);
  };

  if (isLoading || !server) {
    return (
      <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Server Console</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64 bg-dark-surface/50 mb-4" />
          <Skeleton className="w-full h-10 bg-dark-surface/50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-card rounded-lg shadow-md border border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Server Console</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={consoleRef}
          className="console-output h-64 p-3 rounded-md bg-dark-surface border border-gray-700 mb-4 overflow-y-auto font-mono text-sm text-gray-300"
        >
          {consoleOutput.map((line, index) => (
            <div key={index} className="pb-1">
              {line.startsWith('>') ? (
                <span className="text-primary">{line}</span>
              ) : line.includes('[INFO]') ? (
                <span className="text-blue-400">{line}</span>
              ) : line.includes('[WARN]') ? (
                <span className="text-yellow-400">{line}</span>
              ) : line.includes('[ERROR]') ? (
                <span className="text-red-400">{line}</span>
              ) : line.includes('[Server]') ? (
                <span className="text-green-400">{line}</span>
              ) : (
                line
              )}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSendCommand} className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type a command..."
            className="flex-1 bg-dark-surface border-gray-700"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={server.status.toLowerCase() !== 'running'}
          />
          <Button 
            type="submit"
            disabled={server.status.toLowerCase() !== 'running' || !command.trim()}
          >
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
