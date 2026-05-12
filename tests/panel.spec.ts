import { test, expect } from '@grafana/plugin-e2e';

test('renders the provisioned XY chart panel', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });

  await expect(panelEditPage.panel.locator.locator('canvas')).toBeVisible();
});

test('renders the empty state when panel data is empty', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });

  await expect(panelEditPage.panel.locator).toContainText('Err');
});
