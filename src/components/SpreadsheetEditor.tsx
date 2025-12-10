import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchSheetData, SheetRow } from '@/lib/googleSheets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Edit2, Save, X, LogOut } from 'lucide-react';

const SpreadsheetEditor = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { headers, rows } = await fetchSheetData();
      setHeaders(headers);
      setRows(rows);
    } catch (error) {
      toast({
        title: '錯誤',
        description: '無法讀取試算表資料',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userEmail = user?.email || '';

  const handleEdit = (rowIndex: number, data: string[]) => {
    setEditingRow(rowIndex);
    setEditedData([...data]);
  };

  const handleSave = async () => {
    toast({
      title: '提示',
      description: '由於 Google 試算表是唯讀模式，編輯功能需要連接 Google Sheets API 才能儲存變更。目前只能查看資料。',
    });
    setEditingRow(null);
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedData([]);
  };

  const handleInputChange = (colIndex: number, value: string) => {
    const newData = [...editedData];
    newData[colIndex] = value;
    setEditedData(newData);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="mx-auto max-w-6xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>試算表編輯器</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              登入電郵: {userEmail}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重新載入
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index}>{header || `欄 ${String.fromCharCode(65 + index)}`}</TableHead>
                  ))}
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isEditing = editingRow === row.rowIndex;

                  return (
                    <TableRow key={row.rowIndex}>
                      {row.data.map((cell, colIndex) => (
                        <TableCell key={colIndex}>
                          {isEditing ? (
                            <Input
                              value={editedData[colIndex] || ''}
                              onChange={(e) => handleInputChange(colIndex, e.target.value)}
                              className="min-w-[100px]"
                            />
                          ) : (
                            cell
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(row.rowIndex, row.data)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {isEditing && (
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancel}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              沒有資料
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpreadsheetEditor;
