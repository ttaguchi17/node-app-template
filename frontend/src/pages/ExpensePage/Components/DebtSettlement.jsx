import { useState } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowRight, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

export function DebtSettlement({
  settlements,
  onRecordSettlement,
  pendingSettlements,
  completedSettlements,
  onConfirmSettlement,
  onDeclineSettlement,
  currentUserId,
  people
}) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);

  const totalTransactions = settlements.length + pendingSettlements.length;
  const allSettled = totalTransactions === 0;

  const getPerson = (personId) => {
    return people.find(p => p.id === personId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Settlement Summary Section */}
      <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-foreground">Settlement Summary</h3>
            <p className="text-muted-foreground text-sm mt-0.5">
              {allSettled 
                ? 'All expenses are settled!'
                : `${totalTransactions} transaction${totalTransactions !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isSummaryOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="px-6 py-4">
            {allSettled && (
              <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-5 h-5" />
                <p>Everyone is even!</p>
              </div>
            )}

            {(settlements.length > 0 || pendingSettlements.length > 0) && (
              <div className="space-y-3">
                <h4 className="text-sm text-muted-foreground">Outstanding Settlements</h4>

                {/* Non-pending settlements */}
                {settlements.map((settlement, index) => {
                  const fromPerson = getPerson(settlement.from);
                  const toPerson = getPerson(settlement.to);
                  const canRecord = settlement.from === currentUserId;

                  return (
                    <div
                      key={`settlement-${index}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${settlement.fromColor} text-white`}>
                          {settlement.fromInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.fromName}</span>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${settlement.toColor} text-white`}>
                          {settlement.toInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.toName}</span>

                      <span className="ml-auto text-foreground mr-3">
                        ${settlement.amount.toFixed(2)}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-4 border-gray-300 hover:bg-gray-50"
                        onClick={() => onRecordSettlement(settlement)}
                        disabled={!canRecord}
                      >
                        Record
                      </Button>
                    </div>
                  );
                })}

                {/* Pending settlements */}
                {pendingSettlements.map((settlement) => {
                  const fromPerson = getPerson(settlement.from);
                  const toPerson = getPerson(settlement.to);
                  const isReceiver = settlement.to === currentUserId;

                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${fromPerson?.color || 'bg-gray-500'} text-white`}>
                          {fromPerson?.initials || settlement.fromName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.fromName}</span>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${toPerson?.color || 'bg-gray-500'} text-white`}>
                          {toPerson?.initials || settlement.toName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.toName}</span>

                      <span className="ml-auto text-foreground mr-3">${settlement.amount.toFixed(2)}</span>

                      {isReceiver ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1">
                            Pending Approval
                          </Badge>
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onConfirmSettlement(settlement.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          {onDeclineSettlement && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => onDeclineSettlement(settlement.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Transaction Records Section */}
      {completedSettlements.length > 0 && (
        <>
          <Separator />
          <Collapsible open={isRecordsOpen} onOpenChange={setIsRecordsOpen}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground">Transaction Records</h3>
                <Badge variant="outline" className="text-xs">
                  {completedSettlements.length}
                </Badge>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isRecordsOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="px-6 pb-4 space-y-3">
                {completedSettlements.map((settlement) => {
                  const fromPerson = getPerson(settlement.from);
                  const toPerson = getPerson(settlement.to);

                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${fromPerson?.color || 'bg-gray-500'} text-white`}>
                          {fromPerson?.initials || settlement.fromName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.fromName}</span>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${toPerson?.color || 'bg-gray-500'} text-white`}>
                          {toPerson?.initials || settlement.toName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{settlement.toName}</span>

                      <span className="ml-auto text-foreground mr-3">${settlement.amount.toFixed(2)}</span>

                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-300 text-xs px-2 py-1">
                        Completed
                      </Badge>

                      <span className="text-xs text-muted-foreground">
                        {new Date(settlement.date).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}