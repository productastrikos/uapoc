import { useState, useEffect, useCallback } from 'react';
import { Alert, AISolution } from '../types';
import { comprehensiveScenarios } from '../data/scenarios';

interface GenerateAlertOptions {
  /**
   * Skip the scenario's own probability roll.
   *
   * The ambient generator is meant to be sparse, but the "Trigger Event"
   * button has to raise something every single time it is pressed - otherwise
   * it reads as a dead control.
   */
  force?: boolean;
  /** Prefer a scenario from this subsystem, so the event fits the screen. */
  category?: string;
}

export const useAlertSystem = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiSolutions, setAiSolutions] = useState<AISolution[]>([]);
  const [alertCountdown, setAlertCountdown] = useState<Record<string, number>>({});

  const generateRandomAlert = useCallback((options?: GenerateAlertOptions) => {
    const { force = false, category } = options ?? {};

    const pool = category
      ? comprehensiveScenarios.filter(s => s.category === category)
      : comprehensiveScenarios;
    const source = pool.length ? pool : comprehensiveScenarios;
    const scenario = source[Math.floor(Math.random() * source.length)];

    if (force || Math.random() < scenario.probability) {
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: scenario.category as any,
        title: scenario.name,
        description: scenario.description,
        severity: scenario.impact === 'critical' ? 'critical' : 
                 scenario.impact === 'high' ? 'high' : 
                 scenario.impact === 'medium' ? 'medium' : 'low',
        status: 'new',
        aiRecommendation: {
          action: scenario.actions[0],
          confidence: scenario.aiConfidence,
          reasoning: `AI analysis based on ${scenario.trigger} patterns`,
          estimatedImpact: `${scenario.estimatedDuration}min duration, $${Math.abs(scenario.costImpact)} impact`,
          costSaving: Math.abs(scenario.costImpact),
          energySaving: Math.abs(scenario.energyImpact)
        },
        countdown: 10,
        autoSolveEnabled: scenario.aiConfidence >= 80,
        manualOverride: false,
        aiSolutionHistory: []
      };

      setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
      
      if (alert.autoSolveEnabled) {
        setAlertCountdown(prev => ({ ...prev, [alert.id]: 10 }));
      }
    }
  }, []);

  const handleAlertAction = useCallback((alertId: string, action: 'ai' | 'manual' | 'ignore') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        if (action === 'ai') {
          const solution: AISolution = {
            timestamp: new Date().toISOString(),
            action: alert.aiRecommendation?.action || 'AI Solution Applied',
            success: Math.random() > 0.05, // 95% success rate
            timeSaved: Math.floor(Math.random() * 30) + 10,
            energySaved: alert.aiRecommendation?.energySaving || 0,
            costSaved: alert.aiRecommendation?.costSaving || 0,
            confidence: alert.aiRecommendation?.confidence || 0
          };

          setAiSolutions(prev => [solution, ...prev.slice(0, 49)]); // Keep last 50 solutions

          return {
            ...alert,
            status: solution.success ? 'resolved' : 'needs-review',
            aiSolutionHistory: [...(alert.aiSolutionHistory || []), solution]
          };
        } else if (action === 'manual') {
          return { ...alert, status: 'acknowledged', manualOverride: true };
        } else {
          return { ...alert, status: 'resolved' };
        }
      }
      return alert;
    }));

    // Clear countdown
    setAlertCountdown(prev => {
      const newCountdown = { ...prev };
      delete newCountdown[alertId];
      return newCountdown;
    });
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAlertCountdown(prev => {
        const newCountdown = { ...prev };
        let hasChanges = false;

        Object.keys(newCountdown).forEach(alertId => {
          if (newCountdown[alertId] > 0) {
            newCountdown[alertId]--;
            hasChanges = true;
          } else if (newCountdown[alertId] === 0) {
            // Auto-solve the alert
            handleAlertAction(alertId, 'ai');
            delete newCountdown[alertId];
            hasChanges = true;
          }
        });

        return hasChanges ? newCountdown : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleAlertAction]);

  // Generate alerts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      generateRandomAlert();
    }, Math.random() * 20000 + 15000); // 15-35 seconds

    // Seed one alert shortly after opening so the centre is never empty.
    const seed = setTimeout(() => generateRandomAlert({ force: true }), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(seed);
    };
  }, [generateRandomAlert]);

  const newAlerts = alerts.filter(alert => alert.status === 'new');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');
  const needsReviewAlerts = alerts.filter(alert => alert.status === 'needs-review');

  return {
    alerts,
    newAlerts,
    resolvedAlerts,
    needsReviewAlerts,
    aiSolutions,
    alertCountdown,
    handleAlertAction,
    generateRandomAlert
  };
};