#include<stdio.h>

int main(){
	int n,bt[30],wt[30],tat[40],avwt,avtat,i,j;
	avwt=0;
	avtat=0;
	printf("Enter number of processes\n");
	scanf("%d",&n);
	printf("The burst time for processes\n");
	for(i=0;i<n;i++){
		printf("P[%d]",i+1); 
		scanf("%d",&bt[i]);                      
	}
	wt[0]=0;
	for(i=1;i<n;i++){
		wt[i]=0;
		for(j=0;j<i;j++){
			wt[i]=wt[i]+bt[j];
		}
	}
	printf("\n Process burst time,waiting time,turn around time");
	for(i=0;i<n;i++){
		tat[i]=bt[i]+wt[i];
		avwt=avwt+wt[i];
		avtat=avtat+tat[i];
		printf("\nP[%d] %d %d %d",i+1,bt[i],wt[i],tat[i]);
	}
	avwt=avwt/n;
	avtat=avtat/n;
	printf("\nAverage waiting time=%d",avwt);
	printf("\nAverage turn around time=%d",avtat);
	return 0;
}
