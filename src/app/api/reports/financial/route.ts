import { NextRequest, NextResponse } from 'next/server';
import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { PremiumFeatureService } from '@/lib/premium-features';
import { FinancialService } from '@/services/financial.service';

/**
 * GET /api/reports/financial
 * Get financial reports (P&L, Cash Flow, Vehicle Profitability)
 * Premium feature: Advanced reporting requires BASIC plan or higher
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantForDashboard();
    const { searchParams } = new URL(request.url);

    const reportType = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check if tenant has access to advanced reporting
    const featureCheck = await PremiumFeatureService.hasFeatureAccess(
      tenantId,
      'advancedReporting'
    );

    // FREE plan can only access basic summary
    if (!featureCheck.allowed && reportType !== 'summary') {
      return NextResponse.json(
        {
          error: featureCheck.reason,
          suggestedPlan: featureCheck.suggestedPlan,
          upgradeMessage: featureCheck.upgradeMessage,
        },
        { status: 403 }
      );
    }

    let reportData;

    switch (reportType) {
      case 'summary':
        // Basic financial summary (available on all plans)
        reportData = await FinancialService.getFinancialSummary(
          tenantId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;

      case 'profit-loss':
        // P&L Report (BASIC and PREMIUM)
        reportData = await FinancialService.getProfitLossReport(
          tenantId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;

      case 'cash-flow':
        // Cash Flow Report (BASIC and PREMIUM)
        reportData = await FinancialService.getCashFlowReport(
          tenantId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;

      case 'vehicle-profitability':
        // Vehicle Profitability Report (BASIC and PREMIUM)
        reportData = await FinancialService.getVehicleProfitability(
          tenantId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      reportType,
      data: reportData,
    });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial report' },
      { status: 500 }
    );
  }
}
