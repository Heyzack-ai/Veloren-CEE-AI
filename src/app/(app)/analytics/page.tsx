'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/kpi-card';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { mockAnalyticsData } from '@/lib/mock-data/analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { keyMetrics, dossiersOverTime, processingTimeDistribution, accuracyByDocumentType, performanceByInstaller, validatorPerformance } = mockAnalyticsData;

  const installerColumns: Column<typeof performanceByInstaller[0]>[] = [
    {
      key: 'installerName',
      header: 'Installateur',
      cell: (item) => <span className="font-medium">{item.installerName}</span>,
    },
    {
      key: 'dossiersSubmitted',
      header: 'Dossiers soumis',
      cell: (item) => <span>{item.dossiersSubmitted}</span>,
    },
    {
      key: 'approvalRate',
      header: 'Taux d\'approbation',
      cell: (item) => <span>{item.approvalRate.toFixed(1)}%</span>,
    },
    {
      key: 'averageIssues',
      header: 'Problèmes moyens',
      cell: (item) => <span>{item.averageIssues.toFixed(1)}</span>,
    },
    {
      key: 'trend',
      header: 'Tendance',
      cell: (item) => {
        const Icon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
        const color = item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-600';
        return <Icon className={`h-4 w-4 ${color}`} />;
      },
    },
  ];

  const validatorColumns: Column<typeof validatorPerformance[0]>[] = [
    {
      key: 'validatorName',
      header: 'Validateur',
      cell: (item) => <span className="font-medium">{item.validatorName}</span>,
    },
    {
      key: 'dossiersValidated',
      header: 'Dossiers validés',
      cell: (item) => <span>{item.dossiersValidated}</span>,
    },
    {
      key: 'averageTimePerDossier',
      header: 'Temps moyen',
      cell: (item) => <span>{item.averageTimePerDossier.toFixed(1)}h</span>,
    },
    {
      key: 'accuracyRate',
      header: 'Taux de précision',
      cell: (item) => <span>{item.accuracyRate.toFixed(1)}%</span>,
    },
    {
      key: 'overridesMade',
      header: 'Contournements',
      cell: (item) => <span>{item.overridesMade}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytique</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des performances du système
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total traité"
          value={keyMetrics.totalProcessed}
          variant="info"
        />
        <KPICard
          title="Taux d'approbation"
          value={`${keyMetrics.approvalRate}%`}
          variant="success"
        />
        <KPICard
          title="Temps moyen"
          value={`${keyMetrics.averageProcessingTime}h`}
          variant="default"
        />
        <KPICard
          title="Précision IA"
          value={`${keyMetrics.aiAccuracyRate}%`}
          variant="success"
        />
        <KPICard
          title="Taux de rejet"
          value={`${keyMetrics.rejectionRate}%`}
          variant="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dossiers dans le temps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dossiersOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')} />
              <Legend />
              <Line type="monotone" dataKey="submitted" stroke="#8884d8" name="Soumis" />
              <Line type="monotone" dataKey="approved" stroke="#82ca9d" name="Approuvés" />
              <Line type="monotone" dataKey="rejected" stroke="#ff7c7c" name="Rejetés" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution du temps de traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={processingTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Nombre de dossiers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Précision par type de document</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={accuracyByDocumentType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="documentType" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#82ca9d" name="Précision (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance par installateur</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={installerColumns}
            data={performanceByInstaller}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance des validateurs</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={validatorColumns}
            data={validatorPerformance}
          />
        </CardContent>
      </Card>
    </div>
  );
}